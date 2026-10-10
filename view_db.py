"""
ClauseVader Database Quick Viewer
Run: python view_db.py [table_name]
Example:
  python view_db.py
  python view_db.py documents
  python view_db.py clauses
  python view_db.py user
  python view_db.py negotiation_drafts
  python view_db.py chats
"""

import sys
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://clausevaderadmin:SMDtiv2024@clausevader-db.cluster-c30moyki61ex.ap-south-2.rds.amazonaws.com:5432/postgres"

def main():
    table = sys.argv[1] if len(sys.argv) > 1 else None

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if not table:
        print("\n=======================================================")
        print("  ClauseVader Database - Available Tables (Aurora PostgreSQL)")
        print("=======================================================")
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        tables = [r['table_name'] for r in cur.fetchall()]
        for t in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            count = cur.fetchone()['count']
            print(f"  • {t:<22} ({count} rows)")
        print("\nTip: Run 'python view_db.py <table_name>' to view table data.")
        print("Example: python view_db.py documents\n")
        conn.close()
        return

    print(f"\n--- Querying table: '{table}' ---\n")
    cur.execute(f'SELECT * FROM "{table}" ORDER BY 1 DESC LIMIT 10')
    rows = cur.fetchall()

    if not rows:
        print(f"No rows found in '{table}'.")
    else:
        for idx, row in enumerate(rows, 1):
            print(f"[{idx}] ----------------------------------------------------")
            for k, v in row.items():
                val_str = str(v)
                if len(val_str) > 120:
                    val_str = val_str[:117] + "..."
                print(f"  {k:<20}: {val_str}")
            print()

    conn.close()

if __name__ == "__main__":
    main()
