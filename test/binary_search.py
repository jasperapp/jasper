package main

import (
    "fmt"
)
def containsDuplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False

# Example
nums = [1, 2, 3, 1]
print(containsDuplicate(nums))  # Output: True

nums = [1, 2, 3, 4]
print(containsDuplicate(nums))  # Output: False






// binarySearch function to perform binary search on a sorted array
func binarySearch(arr []int, target int) int {
    left, right := 0, len(arr)-1

    for left <= right {
        mid := left + (right-left)/2

        if arr[mid] == target {
            return mid // target found
        } else if arr[mid] < target {
            left = mid + 1 // search in the right half
        } else {
            right = mid - 1 // search in the left half
        }
    }

    return -1 // target not found
}

# Python program to check if the number is an Armstrong number or not

# take input from the user
num = int(input("Enter a number: "))

# initialize sum
sum = 0

# find the sum of the cube of each digit
temp = num
while temp > 0:
   digit = temp % 10
   sum += digit ** 3
   temp //= 10

# display the result
if num == sum:
   print(num,"is an Armstrong number")
else:
   print(num,"is not an Armstrong number")

func main() {
    arr := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    target := 7

    result := binarySearch(arr, target)
    if result != -1 {
        fmt.Printf("Element %d found at index %d\n", target, result)
    } else {
        fmt.Printf("Element %d not found in the array\n", target)
    }
}

def isAnagram(s, t):
    if len(s) != len(t):
        return False
    
    char_count = {}
    
    for char in s:
        if char in char_count:
            char_count[char] += 1
        else:
            char_count[char] = 1
        
    for char in t:
        if char in char_count:
            char_count[char] -= 1
            if char_count[char] == 0:
                del char_count[char]
        else:
            return False
        
    return len(char_count) == 0

# Test the function
s = "anagram"
t = "nagaram"
print(isAnagram(s, t))  # Output: True

s = "rat"
t = "car"
print(isAnagram(s, t))  # Output: False


