# This program calculates the area of a circle

import math

radius = float(input("Enter the radius of the circle: "))
area = math.pi * radius**2

print(f"The area of the circle with radius {radius} is {area}.")

# This program swaps the values of two variables

x = 5
y = 10

print(f"Before swapping: x = {x}, y = {y}")

temp = x
x = y
y = temp

print(f"After swapping: x = {x}, y = {y}")

# This program generates a list of squares of numbers from 1 to 10

squares = [x**2 for x in range(1, 11)]

print("List of squares of numbers from 1 to 10:")
for square in squares:
    print(square)

# This program checks if a given number is prime

num = 17

is_prime = True
for i in range(2, int(math.sqrt(num)) + 1):
    if num % i == 0:
        is_prime = False
        break

if is_prime:
    print(f"{num} is a prime number.")
else:
    print(f"{num} is not a prime number.")
