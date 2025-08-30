interface Person {
  name: string;
  age: number;
  email?: string;
}

class Employee implements Person {
  name: string;
  age: number;
  email?: string;

  constructor(name: string, age: number, email?: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }

  printDetails() {
    console.log(`Name: ${this.name}, Age: ${this.age}, Email: ${this.email || 'N/A'}`);
  }
}

const employee1 = new Employee('John Doe', 30, 'john.doe@example.com');
const employee2 = new Employee('Jane Smith', 25);

employee1.printDetails();
employee2.printDetails();

// write code for merge sort
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}