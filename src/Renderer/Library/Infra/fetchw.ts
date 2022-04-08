type Config = {
  method: 'get' | 'post';
  body?: Record<string, string>;
  headers?: Record<string, string>;
}

export async function fetchw<T>(url: string, config: Config): Promise<{error?: Error; res?: T}> {
  const requestInit: RequestInit = {
    method: config.method.toUpperCase(),
    headers: config.headers,
    body: config.method === 'post' ? toFormData(config.body) : undefined,
  };

  try {
    const res = await fetch(buildUrl(url, config), requestInit);
    if (res.ok) {
      return {res: await res.json()};
    } else {
      const text = await res.text();
      return {error: new Error(text)};
    }
  } catch (e) {
    return {error: e}
  }
}

function buildUrl(url: string, config: Config): string {
  if (config.method === 'get' && config.body != null) {
    return `${url}?${toQueryString(config.body)}`;
  } else {
    return url;
  }
}

function toQueryString(data: Record<string, string>): string {
  const params: string[] = [];
  for (const key of Object.keys(data)) {
    params.push(`${key}=${encodeURIComponent(data[key])}`);
  }
  return params.join('&');
}

function toFormData(data: Record<string, string>): FormData {
  const body = new FormData();
  for (const key of Object.keys(data)) {
    body.append(key, data[key]);
  }
  return body;
}
