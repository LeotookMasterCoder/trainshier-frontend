import sys
import subprocess

# Try to import psycopg2, install if missing
try:
    import psycopg2
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2

conn_str = "postgresql://postgres.xraxenoollrlkxgmzcdn:m1nt3st.c0m@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Check tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    tables = cur.fetchall()
    print("Tables in public schema:")
    for t in tables:
        print(f" - {t[0]}")
        
    # Check users
    cur.execute("SELECT id_usuario, nombre, correo, rol, fecha_registro, rfid_uid FROM usuarios ORDER BY id_usuario DESC LIMIT 10;")
    users = cur.fetchall()
    print("\nRecent users in usuarios table:")
    for u in users:
        print(f"ID: {u[0]}, Name: {u[1]}, Email: {u[2]}, Role: {u[3]}, Date: {u[4]}, RFID: {u[5]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Database error:", e)
