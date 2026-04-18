import os
import json

from log_chain import LogChain

def run_demo():
    print("==========================================")
    print(" TAMPER-EVIDENT LOGGING SYSTEM (TASK 1)   ")
    print("==========================================")
    file_path = "demo_logs.json"
    
    if os.path.exists(file_path):
        os.remove(file_path)

    chain = LogChain(file_path)
    
    print("\n[Scenario 1: Clean Chain]")
    print("-> Adding 5 legitimate entries...")
    for i in range(1, 6):
        chain.add_entry(f"USER_LOGIN", f"User {i} logged in successfully")
    print("Result:", chain.verify_chain())
    
    print("\n[Scenario 2: Single Alteration]")
    print("-> Attacker edits the text of entry #3 in JSON...")
    with open(file_path, "r") as f:
        data = json.load(f)
    data[3]["description"] = "User 3 login bypassed by attacker"
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)
        
    chain_alt = LogChain(file_path)
    print("Result:", chain_alt.verify_chain())

    # Build fresh chain
    os.remove(file_path)
    chain = LogChain(file_path)
    for i in range(1, 6):
        chain.add_entry(f"DATA_ACCESS", f"File accessed by User {i}")

    print("\n[Scenario 3: Covered Deletion]")
    print("-> Attacker deletes entry #3 entirely to hide their tracks...")
    with open(file_path, "r") as f:
        data = json.load(f)
    del data[3]
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

    chain_del = LogChain(file_path)
    print("Result:", chain_del.verify_chain())

    # Build fresh chain
    os.remove(file_path)
    chain = LogChain(file_path)
    for i in range(1, 6):
        chain.add_entry(f"PROCESS_SPAWN", f"ProcID {1000 + i} started")

    print("\n[Scenario 4: Reordering]")
    print("-> Attacker swaps entries #2 and #3...")
    with open(file_path, "r") as f:
        data = json.load(f)
    data[2], data[3] = data[3], data[2]
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

    chain_reorder = LogChain(file_path)
    print("Result:", chain_reorder.verify_chain())
    print()

if __name__ == "__main__":
    run_demo()
