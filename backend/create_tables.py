from db import engine
from models import Base

print("Creating ClauseVader database tables...")

Base.metadata.create_all(bind=engine)

print("Done. All tables created successfully.")