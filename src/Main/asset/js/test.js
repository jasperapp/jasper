// Function to calculate the factorial of a number recursively
function factorial(n) {
    if (n === 0) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

// Test cases
function testFactorialFunction() {
    console.log(factorial(5)); // Expected output: 120
    console.log(factorial(0)); // Expected output: 1
    console.log(factorial(4)); // Expected output: 24
    console.log(factorial(3)); // Expected output: 6
}

// Run the test cases
testFactorialFunction();