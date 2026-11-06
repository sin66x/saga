/** Reading picked files and handing files to the user (downloads). */

export async function readUriBytes(uri: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(uri)).arrayBuffer());
}

export async function readUriText(uri: string): Promise<string> {
  return (await fetch(uri)).text();
}

/** Gives a file to the user as a download. */
export function shareFile(name: string, data: string | Uint8Array): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart]));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
