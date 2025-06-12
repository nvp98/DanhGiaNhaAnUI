
function convertToISO(dateString: string) {
    // Parse the date string
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0);
    const isoString = date.toISOString();
    return isoString;
}

export default convertToISO