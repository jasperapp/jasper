def is_armstrong_number(num):
    # Convert the number to a string to easily iterate over digits
    num_str = str(num)
    # Calculate the number of digits
    num_digits = len(num_str)
    # Calculate the sum of the digits raised to the power of the number of digits
    sum_of_powers = sum(int(digit) ** num_digits for digit in num_str)
    # Check if the sum of powers is equal to the original number
    return sum_of_powers == num

def find_armstrong_numbers(start, end):
    armstrong_numbers = []
    for num in range(start, end + 1):
        if is_armstrong_number(num):
            armstrong_numbers.append(num)
    return armstrong_numbers

# Example usage
start = 100
end = 999
armstrong_numbers = find_armstrong_numbers(start, end)
print(f"Armstrong numbers between {start} and {end}: {armstrong_numbers}")