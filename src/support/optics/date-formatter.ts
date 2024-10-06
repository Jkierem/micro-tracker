export const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toLocaleString().padStart(2, "0");
    const day = (date.getDate()).toLocaleString().padStart(2, "0");

    return `${day}/${month}/${year} ${date.getHours()}:${date.getMinutes()}`;
} 