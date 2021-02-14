

numbers_list = [46, 56, 112, 28, 17, 496, 23, 555, 8128, 156, 6544, 1235455]

def check_if_perfect(numbers_list):

    for n in numbers_list:

        sum = 0    
        for i in range(1, n):
            if n%i == 0:
                sum +=i
                
        if sum < n: print('Number is defective')
        if sum > n: print('Number is abundant')
        if sum == n: print('Number is perfect')


check_if_perfect(numbers_list)
