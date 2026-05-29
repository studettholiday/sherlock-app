// Single source of truth for POST /api/library/upload. Called from
// LibraryOwnerPanel (the Files panel) and from Chat.jsx's "+" menu.
//
// Pre-checks the 50MB size limit before hitting the network. Surfaces the
// server's error message verbatim on non-2xx — including the localized 422
// returned when PDF text extraction yields too little text.

export async function uploadToLibrary(file, lang) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error(lang === 'GEO' ? 'ფაილი უნდა იყოს 50MB-ზე ნაკლები.' : 'File must be under 50MB.');
  }
  const token = localStorage.getItem('sherlock_token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/library/upload?lang=${lang === 'GEO' ? 'ka' : 'en'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.file;
}
