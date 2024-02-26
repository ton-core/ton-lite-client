export function findIntersection(arr1: string[], arr2: string[]) {
    return arr1.filter(value => arr2.includes(value));
}
export function findOnlyOnFirst(arr1: string[], arr2: string[]) {
    return arr1.filter(value => !arr2.includes(value));
}