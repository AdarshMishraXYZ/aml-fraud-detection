import React, { useState, useEffect, useRef } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ForceGraph2D from 'react-force-graph-2d';

const API = 'https://aml-fraud-detection.onrender.com';

function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const graphRef = useRef();

  useEffect(() => {
    fetch(`${API}/api/graph/full-report`)
      .then(res => {
        return res.json();
      })
      .then(data => { setReport(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className='page'><h2 style={{color:'#aaa'}}>Loading...</h2></div>;
  if (error) return <div className='page'><h2 style={{color:'#f85149'}}>Error: {error}</h2></div>;

  const circular = report.circular_transactions || [];
  const mules = report.mule_accounts || [];
  const layering = report.layering_detected || [];
  const summary = report.summary || {};

  const buildGraphData = () => {
    const nodesMap = {};
    const links = [];
    const addNode = (id, type) => { if (!nodesMap[id]) nodesMap[id] = { id, type }; };
    circular.forEach(c => {
      addNode(c.person1, 'circular'); addNode(c.person2, 'circular'); addNode(c.person3, 'circular');
      links.push({ source: c.person1, target: c.person2, amount: c.amount1, type: 'circular' });
      links.push({ source: c.person2, target: c.person3, amount: c.amount2, type: 'circular' });
      links.push({ source: c.person3, target: c.person1, amount: c.amount3, type: 'circular' });
    });
    mules.forEach(m => addNode(m.mule_account, 'mule'));
    layering.forEach(l => {
      const hops = [l.origin, l.hop1, l.hop2, l.hop3, l.destination].filter(Boolean);
      hops.forEach((h, i) => {
        addNode(h, i === 0 || i === hops.length-1 ? 'layering_endpoint' : 'layering');
        if (i < hops.length-1) links.push({ source: hops[i], target: hops[i+1], type: 'layering' });
      });
    });
    return { nodes: Object.values(nodesMap), links };
  };

  const graphData = buildGraphData();
  const nodeColor = n => ({ circular:'#f85149', mule:'#e3b341', layering:'#58a6ff', layering_endpoint:'#8b5cf6' }[n.type] || '#8b949e');
  const linkColor = l => ({ circular:'#f85149', layering:'#58a6ff' }[l.type] || '#8b949e');
  const tabStyle = t => ({ padding:'10px 24px', border:'none', borderRadius:'6px 6px 0 0', cursor:'pointer', fontSize:'14px', fontWeight:'bold', background: activeTab===t ? '#e94560':'#21262d', color: activeTab===t ? 'white':'#8b949e', marginRight:'4px' });


  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(233, 69, 96);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AML FRAUD ANALYSIS REPORT', pageWidth / 2, 16, { align: 'center' });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('Generated: ' + new Date().toLocaleString(), pageWidth / 2, 22, { align: 'center' });

    let y = 35;

    // Summary boxes
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 14, y);
    y += 6;

    const summaryData = [
      ['Circular Rings', summary.circular_rings || 0],
      ['Mule Accounts', summary.mule_accounts || 0],
      ['Layering Chains', summary.layering_chains || 0],
      ['Total Patterns', summary.total_patterns || 0],
    ];
    autoTable(doc, {
      startY: y,
      head: [['Pattern Type', 'Count']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [233, 69, 96], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
      tableWidth: 80,
    });
    y = doc.lastAutoTable.finalY + 12;

    // Circular Rings
    doc.setFontSize(12);
    doc.setTextColor(248, 81, 73);
    doc.setFont('helvetica', 'bold');
    doc.text('Circular Fraud Rings', 14, y);
    y += 4;
    if (circular.length === 0) {
      doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
      doc.text('No circular rings detected', 14, y + 6);
      y += 14;
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Person 1', 'Person 2', 'Person 3', 'Amount 1', 'Amount 2', 'Amount 3']],
        body: circular.map(c => [c.person1, c.person2, c.person3,
          'Rs' + Number(c.amount1).toLocaleString(),
          'Rs' + Number(c.amount2).toLocaleString(),
          'Rs' + Number(c.amount3).toLocaleString()]),
        theme: 'grid',
        headStyles: { fillColor: [248, 81, 73], textColor: 255 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Mule Accounts
    doc.setFontSize(12);
    doc.setTextColor(227, 179, 65);
    doc.setFont('helvetica', 'bold');
    doc.text('Mule Accounts', 14, y);
    y += 4;
    if (mules.length === 0) {
      doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
      doc.text('No mule accounts detected', 14, y + 6);
      y += 14;
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Account', 'Number of Senders', 'Total Received']],
        body: mules.map(m => [m.mule_account, m.number_of_senders, 'Rs' + Number(m.total_amount).toLocaleString()]),
        theme: 'grid',
        headStyles: { fillColor: [227, 179, 65], textColor: 0 },
        alternateRowStyles: { fillColor: [255, 252, 235] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Layering Chains
    doc.setFontSize(12);
    doc.setTextColor(88, 166, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Layering Chains', 14, y);
    y += 4;
    if (layering.length === 0) {
      doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
      doc.text('No layering chains detected', 14, y + 6);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Origin', 'Hop 1', 'Hop 2', 'Hop 3', 'Destination']],
        body: layering.map(l => [l.origin, l.hop1, l.hop2, l.hop3, l.destination]),
        theme: 'grid',
        headStyles: { fillColor: [88, 166, 255], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 255] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('AML Detection System - Confidential', 14, doc.internal.pageSize.getHeight() - 8);
      doc.text('Page ' + i + ' of ' + pageCount, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save('fraud-report-' + new Date().toISOString().split('T')[0] + '.pdf');
  };
  return (
    <div className='page'>
      <h1 style={{color:'#e94560'}}>Fraud Analysis Report</h1>
      <div className='cards'>
        <div className='card red'><h3>CIRCULAR RINGS</h3><p>{summary.circular_rings||0}</p></div>
        <div className='card yellow'><h3>MULE ACCOUNTS</h3><p>{summary.mule_accounts||0}</p></div>
        <div className='card blue'><h3>LAYERING CHAINS</h3><p>{summary.layering_chains||0}</p></div>
        <div className='card'><h3>TOTAL PATTERNS</h3><p>{summary.total_patterns||0}</p></div>
      </div>
      <div style={{marginTop:'30px'}}>
        <button onClick={exportPDF} style={{padding:'10px 20px',background:'#3fb950',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px',fontWeight:'bold',marginRight:'10px'}}>📄 Export PDF</button><button style={tabStyle('table')} onClick={()=>setActiveTab('table')}>Table View</button>
        <button style={tabStyle('graph')} onClick={()=>setActiveTab('graph')}>Graph View</button>
      </div>
      {activeTab==='table' && (
        <div style={{border:'1px solid #30363d',borderRadius:'0 8px 8px 8px',padding:'20px'}}>
          <h2 style={{borderLeft:'4px solid #f85149',paddingLeft:'12px'}}>Circular Fraud Rings</h2>
          <table><thead><tr><th>PERSON 1</th><th>PERSON 2</th><th>PERSON 3</th><th>AMOUNT 1</th><th>AMOUNT 2</th><th>AMOUNT 3</th></tr></thead>
          <tbody>{circular.length===0?<tr><td colSpan='6' style={{color:'#666',textAlign:'center'}}>No circular rings detected yet</td></tr>:circular.map((c,i)=><tr key={i}><td className='flagged'>{c.person1}</td><td className='flagged'>{c.person2}</td><td className='flagged'>{c.person3}</td><td>Rs{Number(c.amount1).toLocaleString()}</td><td>Rs{Number(c.amount2).toLocaleString()}</td><td>Rs{Number(c.amount3).toLocaleString()}</td></tr>)}</tbody></table>
          <h2 style={{borderLeft:'4px solid #e3b341',paddingLeft:'12px',marginTop:'20px'}}>Mule Accounts</h2>
          <table><thead><tr><th>ACCOUNT</th><th>NUMBER OF SENDERS</th><th>TOTAL RECEIVED</th></tr></thead>
          <tbody>{mules.length===0?<tr><td colSpan='3' style={{color:'#666',textAlign:'center'}}>No mule accounts detected yet</td></tr>:mules.map((m,i)=><tr key={i}><td className='suspicious'>{m.mule_account}</td><td>{m.number_of_senders}</td><td>Rs{Number(m.total_amount).toLocaleString()}</td></tr>)}</tbody></table>
          <h2 style={{borderLeft:'4px solid #58a6ff',paddingLeft:'12px',marginTop:'20px'}}>Layering Chains</h2>
          <table><thead><tr><th>ORIGIN</th><th>HOP 1</th><th>HOP 2</th><th>HOP 3</th><th>DESTINATION</th></tr></thead>
          <tbody>{layering.length===0?<tr><td colSpan='5' style={{color:'#666',textAlign:'center'}}>No layering chains detected yet</td></tr>:layering.map((l,i)=><tr key={i}><td className='flagged'>{l.origin}</td><td>{l.hop1}</td><td>{l.hop2}</td><td>{l.hop3}</td><td className='flagged'>{l.destination}</td></tr>)}</tbody></table>
        </div>
      )}
      {activeTab==='graph' && (
        <div style={{border:'1px solid #30363d',borderRadius:'0 8px 8px 8px',padding:'20px'}}>
          <div style={{display:'flex',gap:'20px',marginBottom:'15px',flexWrap:'wrap'}}>
            {[{color:'#f85149',label:'Circular Ring'},{color:'#e3b341',label:'Mule Account'},{color:'#58a6ff',label:'Layering Hop'},{color:'#8b5cf6',label:'Layering Endpoint'}].map(({color,label})=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:color}}/>
                <span style={{color:'#aaa',fontSize:'13px'}}>{label}</span>
              </div>
            ))}
          </div>
          {graphData.nodes.length===0?(
            <div style={{textAlign:'center',color:'#666',padding:'60px'}}>
              <p>No fraud patterns to visualize yet.</p>
            </div>
          ):(
            <div style={{background:'#0d1117',borderRadius:'8px',overflow:'hidden'}}>
              <ForceGraph2D ref={graphRef} graphData={graphData} width={750} height={500} backgroundColor='#0d1117'
                nodeLabel='id' nodeColor={nodeColor} nodeRelSize={8} linkColor={linkColor} linkWidth={2}
                linkDirectionalArrowLength={6} linkDirectionalArrowRelPos={1}
                nodeCanvasObject={(node,ctx,globalScale)=>{
                  const fontSize=12/globalScale;
                  ctx.font=fontSize+'px Sans-Serif';
                  ctx.fillStyle=nodeColor(node);
                  ctx.beginPath(); ctx.arc(node.x,node.y,6,0,2*Math.PI); ctx.fill();
                  ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
                  ctx.fillText(node.id,node.x,node.y+14);
                }}
                cooldownTicks={100}
                onEngineStop={()=>graphRef.current&&graphRef.current.zoomToFit(400)}
              />
            </div>
          )}
        </div>
      )}
      <br/>
      <button onClick={()=>window.location.href='/'} style={{padding:'10px 20px',background:'#e94560',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'16px'}}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default ReportPage;