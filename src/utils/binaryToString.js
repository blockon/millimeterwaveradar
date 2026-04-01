/** WebSocket 二进制消息转字符串 */
export function binaryToString(binary) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(new Blob([binary]))
  })
}
