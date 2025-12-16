
import subprocess
import re

def run_node_check(content, name):
    with open(f'temp_{name}.js', 'w') as f:
        f.write(content)
        
    try:
        result = subprocess.run(['node', '-c', f'temp_{name}.js'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[{name}] SYNTAX VALID (Exit 0)")
        else:
            print(f"[{name}] SYNTAX ERROR: {result.stderr.strip().split(chr(10))[0]}")
    except Exception as e:
        print(f"[{name}] EXEC ERROR: {e}")

def verify_suspect(file_path):
    with open(file_path, 'r') as f:
        original = f.read()

    lines = original.split('\n')
    
    # Range to Replace: 22326 to 22535
    start_idx = 22326 - 1
    end_idx = 22535 - 1
    
    # Construct Modified File
    # We essentially "delete" the suspect lines by commenting them out or emptying them
    # But we need to keep `const lines` count or just structure.
    # Empty string is safest.
    
    new_lines = list(lines)
    for i in range(start_idx, end_idx + 1):
        new_lines[i] = ""
        
    # We also need to strip JSX components as usual to pass node check
    # Copied from previous logic
    
    # FinanceProTab: 23622-23918
    fin_start = 23622 - 1
    fin_end = 23918 - 1
    new_lines[fin_start] = "        const FinanceProTab = () => {};"
    for i in range(fin_start+1, fin_end): new_lines[i] = ""
    
    # EmmaConfigTab: 23921-23930
    emma_start = 23921 - 1
    emma_end = 23930 - 1
    new_lines[emma_start] = "        const EmmaConfigTab = () => {};"
    for i in range(emma_start+1, emma_end): new_lines[i] = ""
    
    content = "\n".join(new_lines)
    
    # Strip regex JSX
    content = re.sub(r'</?[a-zA-Z_][^>]*>', ' 0 ', content)
    
    # Now we truncate at 23000 (after suspect, before final return)
    # and append "}}" to close Markets + Beta.
    # If suspect block contained the CLOSURE, removing it should leave Markets OPEN.
    # So Open + "}}" -> Valid.
    # If suspect block was NOT the cause (Markets closed earlier?), it would still fail?
    # No, suspect is creating the closure.
    
    trunc_limit = 23000
    trunc_lines = content.split('\n')[:trunc_limit]
    final_content = "\n".join(trunc_lines) + "\n}}"
    
    run_node_check(final_content, "suspect_removed")

verify_suspect('/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/app-inline.js')
