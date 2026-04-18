import hashlib
import json
import time
import os

class LogEntry:
    def __init__(self, event_type, description, prev_hash):
        self.timestamp = time.time()
        self.event_type = event_type
        self.description = description
        self.prev_hash = prev_hash
        self.hash = self._compute_hash()

    def _compute_hash(self):
        data = f"{self.prev_hash}{self.timestamp}{self.event_type}{self.description}"
        return hashlib.sha256(data.encode()).hexdigest()

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "description": self.description,
            "prev_hash": self.prev_hash,
            "hash": self.hash
        }

    @classmethod
    def from_dict(cls, data):
        entry = cls(data["event_type"], data["description"], data["prev_hash"])
        entry.timestamp = data["timestamp"]
        entry.hash = data["hash"]
        return entry

class LogChain:
    def __init__(self, file_path="logs.json"):
        self.file_path = file_path
        self.chain = []
        self.load_from_file()

    def load_from_file(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, "r") as f:
                try:
                    data = json.load(f)
                    self.chain = [LogEntry.from_dict(entry) for entry in data]
                except Exception:
                    self.chain = []
        if not self.chain:
            self._create_genesis_entry()

    def save_to_file(self):
        with open(self.file_path, "w") as f:
            json.dump([entry.to_dict() for entry in self.chain], f, indent=4)

    def _create_genesis_entry(self):
        genesis = LogEntry("SYSTEM_INIT", "Genesis Block", "0" * 64)
        self.chain.append(genesis)
        self.save_to_file()

    def add_entry(self, event_type, description):
        prev_hash = self.chain[-1].hash
        new_entry = LogEntry(event_type, description, prev_hash)
        self.chain.append(new_entry)
        self.save_to_file()
        return new_entry

    def verify_chain(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i-1]
            
            # Recompute to check alteration
            data = f"{current.prev_hash}{current.timestamp}{current.event_type}{current.description}"
            recomputed = hashlib.sha256(data.encode()).hexdigest()
            
            if recomputed != current.hash:
                return f"TAMPERED at entry {i} (Alteration detected in log data)"
            
            if current.prev_hash != prev.hash:
                return f"CHAIN BROKEN at entry {i} (Deletion or Reorder detected)"
                
        return "CHAIN INTACT: No tampering detected"
