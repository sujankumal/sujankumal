export function isNodeJs() {
    if ((typeof process !== 'undefined') && process.release &&
        (process.release.name.search(/node|io.js/) !== -1)) {
        return true;
    } else {
        return false;
    }
}
