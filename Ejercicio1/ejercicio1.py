

def check_if_perfect(number):

    sum = 0    
    for i in range(1, number):
        if number%i == 0:
            sum +=i

    if sum < number: print('Number is defective')
    if sum > number: print('Number is abundant')
    if sum == number: print('Number is perfect')


try:
    check_if_perfect(number = int(input('Enter number:')))
except ValueError:
    print('Invalid input')
