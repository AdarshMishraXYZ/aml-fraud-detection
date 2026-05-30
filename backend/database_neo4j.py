from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "adarsh2005")

try:
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    driver.verify_connectivity()
    print("Neo4j connected successfully!")
except Exception as e:
    print(f"Neo4j connection failed: {e}")
    driver = None

def get_neo4j_session():
    if driver is None:
        return None
    return driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j"))

def add_transaction_to_graph(sender: str, receiver: str, amount: float, status: str):
    print(f"[Neo4j] Adding transaction: {sender} -> {receiver} amount={amount} status={status}")
    if driver is None:
        return
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            session.run("""
                MERGE (s:Person {name: $sender})
                MERGE (r:Person {name: $receiver})
                CREATE (s)-[:SENT {amount: $amount, status: $status}]->(r)
            """, sender=sender, receiver=receiver, amount=amount, status=status)
            print(f"[Neo4j] SUCCESS: {sender} -> {receiver}")
    except Exception as e:
        print(f"Neo4j error: {e}")

def get_fraud_network(name: str):
    if driver is None:
        return []
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            result = session.run("""
                MATCH (p:Person {name: $name})-[t:SENT]->(r:Person)
                RETURN p.name as sender, r.name as receiver, 
                       t.amount as amount, t.status as status
            """, name=name)
            return [record.data() for record in result]
    except Exception as e:
        return []

def detect_circular_transactions():
    if driver is None:
        return []
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            result = session.run("""
                MATCH (a:Person)-[t1:SENT]->(b:Person)-[t2:SENT]->(c:Person)-[t3:SENT]->(a)
                WHERE t1.amount >= 10000 
                AND t2.amount >= 10000 
                AND t3.amount >= 10000
                AND (t1.status IN ['flagged', 'suspicious', 'review'])
                AND (t2.status IN ['flagged', 'suspicious', 'review'])
                AND (t3.status IN ['flagged', 'suspicious', 'review'])
                RETURN a.name as person1, b.name as person2, c.name as person3,
                       t1.amount as amount1, t2.amount as amount2, t3.amount as amount3
            """)
            return [record.data() for record in result]
    except Exception as e:
        return []

def detect_mule_accounts():
    if driver is None:
        return []
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            result = session.run("""
                MATCH (p:Person)<-[t:SENT]-(sender:Person)
                WITH p, count(sender) as incoming_count, 
                     sum(t.amount) as total_received
                WHERE incoming_count >= 3
                AND total_received >= 10000
                RETURN p.name as mule_account,
                       incoming_count as number_of_senders,
                       total_received as total_amount
                ORDER BY incoming_count DESC
            """)
            return [record.data() for record in result]
    except Exception as e:
        return []

def detect_smurfing(sender: str):
    if driver is None:
        return []
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            result = session.run("""
                MATCH (s:Person {name: $sender})-[t:SENT]->(r:Person)
                WITH s, count(t) as transaction_count,
                     sum(t.amount) as total_amount,
                     avg(t.amount) as avg_amount
                WHERE transaction_count >= 3
                AND total_amount >= 10000
                AND avg_amount < 10000
                RETURN s.name as sender,
                       transaction_count,
                       total_amount,
                       avg_amount
            """, sender=sender)
            return [record.data() for record in result]
    except Exception as e:
        return []

def detect_layering():
    if driver is None:
        return []
    try:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
            result = session.run("""
                MATCH (a:Person)-[:SENT]->(b:Person)-[:SENT]->(c:Person)-[:SENT]->(d:Person)-[:SENT]->(e:Person)
                WHERE a <> e
                RETURN a.name as origin,
                       b.name as hop1,
                       c.name as hop2,
                       d.name as hop3,
                       e.name as destination
                LIMIT 10
            """)
            return [record.data() for record in result]
    except Exception as e:
        return []