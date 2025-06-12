function isMoreThanFiveDaysAway(targetDateString: string): boolean {
    const targetDate = new Date(targetDateString);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - targetDate.getTime(); // tính bằng milliseconds
    const differenceInDays = differenceInTime / (1000 * 3600 * 24); // chuyển đổi sang ngày    
    return differenceInDays > 5;

}

export default isMoreThanFiveDaysAway;