import { BrowserWindow } from 'electron'
export function sendToRender(event, ...args) {
  BrowserWindow.getAllWindows()[0].webContents.send(event, ...args)
}
