import _ from 'lodash'
export const get10Number = (num: number) => {
  if (!num) {
    return ''
  }

  return _.padStart(String(num), 10, '0')
}

export function generateTask(data: any) {
  const { url, directory, filename } = data
  const id = _.toNumber(`${Date.now()}${('' + Math.random()).slice(2, 5)}`)

  return {
    id,
    url,
    directory,
    filename,
    status: 'queued',
    progress: 0,
    downloaded: 0,
    size: null,
  }
}
