export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export async function openFileDialog(extension, multiple = false, readMode = 'file') {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        input.multiple = multiple;
        if (extension) {
            input.accept = extension;
        }
        document.body.appendChild(input);
        input.click();
        input.onchange = async (e) => {
            if (readMode == 'file') {
                resolve([...input.files].map(x => ({ name: x.name, data: x })));
            }
            else {
                const files = await readFiles(input.files);
                document.body.removeChild(input);
                resolve(files);
            }
        };
    });
}
export async function readFiles(files) {
    return new Promise(async (resolve, reject) => {
        const results = [];
        const ps = [];
        for (const f of files) {
            const p = new Promise((res) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    let readerResult = reader.result;
                    let resultData = readerResult;
                    results.push({ name: f.name, data: resultData, size: resultData.length });
                    res();
                };
                reader.readAsText(f);
            });
            ps.push(p);
        }
        await Promise.all(ps);
        resolve(results);
    });
}
export async function exportData(data, fileName, mimeType) {
    let file = fileName.replace(/[&\\#,+()$~%'":*?<>{}]/g, '').replaceAll('/', '_');
    let blob;
    if (data instanceof ArrayBuffer) {
        blob = new Blob([data], { type: mimeType });
    }
    else {
        mimeType = 'application/json';
        blob = new Blob(['\ufeff' + data], { type: mimeType });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    a.download = file;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    await sleep(300);
    return file;
}
