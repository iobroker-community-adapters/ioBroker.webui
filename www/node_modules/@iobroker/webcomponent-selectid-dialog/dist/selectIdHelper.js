let selectDialog = null;
let storedResolve = null;
/**
 *
 * @param {{host:string, port: number, protocol: 'http:' | 'https:', language: string, selected?: string, allowAll?: boolean, primary?: string; secondary?: string, paper?: string, token?: string}} config
 * @returns {Promise<string?>}
 */
export async function openSelectIdDialog(config) {
    return new Promise(async resolve => {
        storedResolve = resolve;
        if (!selectDialog) {
            await import('./iobrokerSelectId.es.js');
            selectDialog = document.createElement('iobroker-select-id');
            window._iobSelectIdDialogOnSelected = (newId) => {
                selectDialog.setAttribute('open', 'false');
                storedResolve(newId);
            };
            selectDialog.setAttribute('id', 'iob-select-id');
            selectDialog.setAttribute('port', (config.port || window.location.port).toString());
            selectDialog.setAttribute('host', config.host);
            selectDialog.setAttribute('protocol', config.protocol);
            selectDialog.setAttribute('language', config.language);
            selectDialog.setAttribute('onclose', '_iobSelectIdDialogOnSelected');
            selectDialog.setAttribute('primary', '#AD1625');
            selectDialog.setAttribute('secondary', 'rgb(228, 145, 145)');
            selectDialog.setAttribute('paper', 'rgb(243, 243, 243)');
            selectDialog.setAttribute('all', config.allowAll ? 'true' : 'false');
            selectDialog.setAttribute('selected', config.selected);
            selectDialog.setAttribute('token', config.token);
            selectDialog.setAttribute('open', 'true');
            document.body.appendChild(selectDialog);
        } else {
            selectDialog.setAttribute('all', config.allowAll ? 'true' : 'false');
            selectDialog.setAttribute('selected', config.selected);
            selectDialog.setAttribute('token', config.token);
            selectDialog.setAttribute('open', 'true');
        }
    });
}
