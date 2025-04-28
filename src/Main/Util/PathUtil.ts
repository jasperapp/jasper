import fs from 'fs';
import path from 'path';

class _PathUtil {
  getSrcPath() {
    return path.normalize(`${__dirname}/../../`);
  }

  getPath(relativePathFromSrc: string) {
    return path.normalize(`${this.getSrcPath()}/${relativePathFromSrc}`);
  }

  // Read directory and iterate through all subdirectories and files
  readDirectory(dirPath: string) {
    const fullPath = this.getPath(dirPath);
    this.iterateDirectory(fullPath);
  }

  // write code to iterate through all subdirectories and files and log them
  iterateFiles(dirPath: string) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return;
      }

      files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          console.log(`Directory: ${fullPath}`);
        } else {
          console.log(`File: ${fullPath}`);
        }
      });
    });
  }


  private iterateDirectory(dirPath: string) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return;
      }

      files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          console.log(`Directory: ${fullPath}`);
          this.iterateDirectory(fullPath); // Recursively iterate through subdirectories
        } else {
          console.log(`File: ${fullPath}`);
        }
      });
    });
  }
}

export const PathUtil = new _PathUtil();

// Example usage:
PathUtil.readDirectory('some/relative/path');

class Node<T> {
  data: T;
  next: Node<T> | null;

  constructor(data: T) {
      this.data = data;
      this.next = null;
  }
}

class LinkedList<T> {
  head: Node<T> | null;

  constructor() {
      this.head = null;
  }

  // Add a node at the end of the list
  append(data: T): void {
      const newNode = new Node(data);
      if (this.head === null) {
          this.head = newNode;
          return;
      }

      let current = this.head;
      while (current.next !== null) {
          current = current.next;
      }
      current.next = newNode;
  }

  // Add a node at the beginning of the list
  prepend(data: T): void {
      const newNode = new Node(data);
      newNode.next = this.head;
      this.head = newNode;
  }

  // Delete a node by value
  delete(data: T): void {
      if (this.head === null) return;

      if (this.head.data === data) {
          this.head = this.head.next;
          return;
      }

      let current = this.head;
      while (current.next !== null && current.next.data !== data) {
          current = current.next;
      }

      if (current.next !== null) {
          current.next = current.next.next;
      }
  }

  // Print the list
  printList(): void {
      let current = this.head;
      while (current !== null) {
          console.log(current.data);
          current = current.next;
      }
  }
}

// Example usage:
const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.append(3);
list.printList(); // Output: 1 2 3
list.prepend(0);
list.printList(); // Output: 0 1 2 3
list.delete(2);
list.printList(); // Output: 0 1 3


Link