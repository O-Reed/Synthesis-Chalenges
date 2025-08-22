import axios from "axios";

// Create a configured axios instance for Docker environments
const httpClient = axios.create({
  timeout: 30000, // 30 second default timeout
  maxRedirects: 5,
  validateStatus: (status) => status < 400,
  headers: {
    'User-Agent': 'Mini-Orchestrator/1.0',
    'Accept': 'text/plain,text/html,application/json,*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  }
});

export type HttpFetchInput = { url: string; timeoutMs?: number };
export type HttpFetchOutput = { body: string; url: string };

export async function http_fetch(input: HttpFetchInput, abort: AbortSignal): Promise<HttpFetchOutput> {
  const { url, timeoutMs = 10000 } = input;
  console.log(`[http_fetch] Attempting to fetch: ${url}`);
  
  try {
    const ctrl = new AbortController();
    abort.addEventListener("abort", () => ctrl.abort());
    
    console.log(`[http_fetch] Making request with timeout: ${timeoutMs}ms`);
    
    // Use configured HTTP client with custom timeout
    const res = await httpClient.get(url, { 
      signal: ctrl.signal, 
      timeout: timeoutMs, 
      responseType: "text"
    });
    
    console.log(`[http_fetch] Success! Status: ${res.status}, Content-Length: ${res.data?.length || 0}`);
    return { body: String(res.data), url };
  } catch (error: any) {
    console.error(`[http_fetch] Error fetching ${url}:`, error?.message || error);
    console.error(`[http_fetch] Error details:`, {
      name: error?.name,
      code: error?.code,
      response: error?.response?.status,
      timeout: error?.timeout,
      isAxiosError: error?.isAxiosError
    });
    
    // Enhanced error handling for common issues
    if (error?.code === 'ECONNRESET') {
      console.error(`[http_fetch] Connection reset - possible network issue`);
    } else if (error?.code === 'ETIMEDOUT') {
      console.error(`[http_fetch] Timeout - increasing timeout or checking network`);
    } else if (error?.code === 'ENOTFOUND') {
      console.error(`[http_fetch] DNS resolution failed`);
    }
    
    throw error;
  }
}
