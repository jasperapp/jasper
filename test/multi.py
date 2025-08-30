def convert_decimal(number):
    binary = bin(number)
    octal = oct(number)
    hexadecimal = hex(number)
    
    return binary, octal, hexadecimal

# Example usage
number = 42
binary, octal, hexadecimal = convert_decimal(number)

print(f"Decimal: {number}")
print(f"Binary: {binary}")
print(f"Octal: {octal}")
print(f"Hexadecimal: {hexadecimal}")