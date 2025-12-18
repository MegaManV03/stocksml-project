#!/usr/bin/env python3
"""
Get only .py, .js, .txt files and ignore junk folders.
"""

import os
from pathlib import Path

def get_dev_files(root_dir=".", extensions=None, ignore_folders=None):
    """
    Get files with specific extensions, ignoring certain folders.
    
    Args:
        root_dir: Starting directory
        extensions: List of file extensions to include
        ignore_folders: List of folders to ignore
    """
    if extensions is None:
        extensions = ['.py', '.js', '.txt']
    if ignore_folders is None:
        ignore_folders = ['node_modules', '__pycache__', '.git', 
                         '.vscode', '.idea', 'venv', 'env', 
                         'dist', 'build', 'bin', 'obj']
    
    root_path = Path(root_dir).resolve()
    results = []
    
    for file_path in root_path.rglob("*"):
        # Skip directories
        if file_path.is_dir():
            continue
            
        # Check extension
        if file_path.suffix.lower() not in extensions:
            continue
            
        # Check if file is in ignored folder
        skip = False
        for ignore in ignore_folders:
            if ignore in file_path.parts:
                skip = True
                break
                
        if not skip:
            # Get relative path
            rel_path = file_path.relative_to(root_path)
            results.append(str(rel_path))
    
    return sorted(results)

if __name__ == "__main__":
    files = get_dev_files()
    for f in files:
        print(f)