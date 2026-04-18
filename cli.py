import argparse
from log_chain import LogChain

def main():
    parser = argparse.ArgumentParser(description="Tamper-Evident Logging System (Task 1)")
    parser.add_argument("--add", nargs=2, metavar=('EVENT_TYPE', 'DESCRIPTION'), help="Add a new log entry")
    parser.add_argument("--verify", action="store_true", help="Verify log chain integrity")
    
    args = parser.parse_args()
    chain = LogChain()

    if args.add:
        chain.add_entry(args.add[0], args.add[1])
        print(f"Added log: {args.add[0]} - {args.add[1]}")
    elif args.verify:
        result = chain.verify_chain()
        print(result)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
