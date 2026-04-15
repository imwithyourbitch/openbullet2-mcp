/**
 * Comprehensive LoliCode syntax reference for OpenBullet 2.
 * This is used by MCP resources and prompts so that connected AI assistants
 * know the exact syntax when writing or editing OB2 configs.
 */

export const LOLICODE_SYNTAX_REFERENCE = `
# OpenBullet 2 — LoliCode Syntax Reference

LoliCode is the scripting language used by OpenBullet 2 configs. It compiles to C# and runs on the .NET runtime. A config's \`loliCodeScript\` field contains the main LoliCode script that defines the bot's workflow.

---

## 1. Config Modes

OpenBullet 2 configs support these modes:
- **LoliCode** — The primary scripting language (this reference)
- **Stack** — Visual block editor (JSON-based block representation)
- **CSharp** — Raw C# scripting
- **LoliScript** — Legacy scripting from OpenBullet 1 (deprecated, avoid for new configs)

When creating/updating configs via the API, set \`mode\` to \`"LoliCode"\` and write the script in the \`loliCodeScript\` field.

---

## 2. Block Syntax

Blocks are the fundamental building units of a LoliCode script. Each block performs a specific action (HTTP request, parsing, key checking, etc.).

### Basic Block Format
\`\`\`
BLOCK:BlockId
  settingName = settingValue
  anotherSetting = anotherValue
  => VAR @outputVariable
ENDBLOCK
\`\`\`

### Block Modifiers (optional, on the BLOCK line)
- \`LABEL:MyLabel\` — Gives the block a custom label for readability
- \`DISABLED\` — Disables the block (it will be skipped during execution)
- \`SAFE\` — Wraps the block in a try-catch so errors don't stop execution

### Full Block Line Format
\`\`\`
BLOCK:BlockId LABEL:My Custom Label DISABLED SAFE
\`\`\`

### Output Variable Assignment
- \`=> VAR @varName\` — Stores the block's return value in a variable
- \`=> CAP @varName\` — Stores as a "capture" variable (included in hit output)

---

## 3. Setting Value Types

Settings inside blocks accept three value types:

### Fixed Values (literals)
\`\`\`
stringParam = "hello world"
intParam = 123
floatParam = 3.14
boolParam = true
\`\`\`

### Variable References
\`\`\`
inputParam = @myVariable
\`\`\`

### Interpolated Strings
Use \`$"..."\` with \`<variableName>\` for interpolation:
\`\`\`
urlParam = $"https://example.com/api/<token>"
bodyParam = $"{\\"email\\":\\"<email>\\",\\"pass\\":\\"<pass>\\"}"
\`\`\`

### List Values
\`\`\`
myList = ["item1", "item2", "item3"]
\`\`\`

### Dictionary Values
\`\`\`
myDict = {("key1", "value1"), ("key2", "value2")}
\`\`\`

---

## 4. Common Block Types

### HttpRequest — Make HTTP Requests
\`\`\`
BLOCK:HttpRequest
  url = "https://example.com/api/login"
  method = POST
  type = STANDARD
  customHeaders = {("Content-Type", "application/json"), ("User-Agent", "Mozilla/5.0")}
  customCookies = {("session", "abc123")}
  stringContent = $"{\\"username\\":\\"<input.USER>\\",\\"password\\":\\"<input.PASS>\\"}"
  contentType = "application/json"
ENDBLOCK
\`\`\`

HTTP Methods: \`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`, \`HEAD\`, \`OPTIONS\`

Content types for POST/PUT:
- \`type = STANDARD\` — Standard string body (use \`stringContent\` and \`contentType\`)
- \`type = MULTIPART\` — Multipart form data
- \`type = BASICAUTH\` — Basic authentication
- \`type = RAW\` — Raw bytes

After an HttpRequest, these auto-variables are set:
- \`data.SOURCE\` — Response body as string
- \`data.RAWSOURCE\` — Response body as byte array
- \`data.STATUS\` — HTTP status code (e.g., 200)
- \`data.HEADERS\` — Response headers (dictionary)
- \`data.COOKIES\` — Response cookies (dictionary)
- \`data.ADDRESS\` — Final URL after redirects
- \`data.RESPONSECODE\` — HTTP status code as string

### Parse — Extract Data from Responses
\`\`\`
BLOCK:Parse
  input = @data.SOURCE
  leftDelim = "\\"token\\":\\""
  rightDelim = "\\""
  MODE:LR
  => CAP @token
ENDBLOCK
\`\`\`

Parse modes (use MODE: prefix on its own line):
- \`MODE:LR\` — Left/Right: uses \`leftDelim\` and \`rightDelim\`. Without RECURSIVE, captures from FIRST prefix to LAST suffix.
- \`MODE:CSS\` — CSS selector: uses \`cssSelector\`. Captures FIRST match only.
- \`MODE:JSON\` — JSON path: uses \`jToken\`
- \`MODE:REGEX\` — Regex: uses \`pattern\` and \`outputFormat\`
- \`MODE:XPATH\` — XPath: uses \`xPath\`

**RECURSIVE modifier for LR mode:**
Add \`RECURSIVE\` on its own line to capture ALL matches (not just first/last):
\`\`\`
BLOCK:Parse
  input = @data.SOURCE
  leftDelim = "item\\":\\""
  rightDelim = "\\""
  RECURSIVE
  MODE:LR
  => CAP @allItems
ENDBLOCK
\`\`\`
This captures ALL occurrences of text between leftDelim and rightDelim.

#### Parse with CSS selector (RECOMMENDED for HTML):
\`\`\`
BLOCK:Parse
  input = @data.SOURCE
  cssSelector = "input[name='csrf_token']"
  MODE:CSS
  => VAR @csrfToken
ENDBLOCK
\`\`\`

**CSS limitations:**
- Works on \`data.SOURCE\` (raw HTML), NOT on variables with parsed strings
- Only captures the FIRST match by default
- For multiple CSS matches, use RECURSIVE with LR or MultiRun job with pagination

#### Parse with LR (Left-Right) - GREEDY without RECURSIVE:
\`\`\`
BLOCK:Parse
  input = @data.SOURCE
  leftDelim = "plan_name\\": \\""
  rightDelim = "\\""
  MODE:LR
  => CAP @plan
ENDBLOCK
\`\`\`

**LR GOTCHAS (without RECURSIVE):**
- LR is GREEDY - finds FIRST \`leftDelim\` and LAST \`rightDelim\`
- Common suffixes like \`</span>\` or \`</div>\` capture ENTIRE page
- Use unique, specific delimiters
- Add \`RECURSIVE\` to capture ALL matches instead

#### Parse with Regex:
\`\`\`
BLOCK:Parse
  input = @data.SOURCE
  pattern = "token\\":\\"([a-zA-Z0-9]+)\\""
  outputFormat = "$1"
  MODE:REGEX
  => CAP @token
ENDBLOCK
\`\`\`

### Keycheck — Determine Hit Status (SUCCESS/FAIL/RETRY/BAN)
\`\`\`
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "Welcome"
    STRINGKEY @data.SOURCE Contains "Dashboard"
  KEYCHAIN FAIL OR
    STRINGKEY @data.SOURCE Contains "Invalid"
    STRINGKEY @data.SOURCE Contains "incorrect"
  KEYCHAIN RETRY OR
    INTKEY @data.STATUS Is 429
    STRINGKEY @data.SOURCE Contains "rate limit"
  KEYCHAIN BAN OR
    INTKEY @data.STATUS Is 403
ENDBLOCK
\`\`\`

KEYCHAIN types:
- \`SUCCESS\` — Mark as a hit (valid combo)
- \`FAIL\` — Mark as invalid
- \`RETRY\` — Retry this data line
- \`BAN\` — Ban the proxy and retry
- \`NONE\` — No status change
- \`CUSTOM "StatusName"\` — Custom status

KEYCHAIN logic:
- \`OR\` — Any key in the chain matches → chain matches
- \`AND\` — All keys in the chain must match

KEY condition types:
- \`STRINGKEY @variable Contains "text"\` (verified working)
- \`STRINGKEY @variable EqualTo "text"\`
- \`STRINGKEY @variable Exists\`
- \`STRINGKEY @variable MatchesRegex "pattern"\`
- \`INTKEY @data.STATUS Is 429\` (verified working for status codes)

**UNSUPPORTED/ERROR-prone:**
- \`NotContains\` - may not work, use Contains with FAIL keychain instead
- \`NotEqualTo\` - may not work
- \`LessThan\`/\`GreaterThan\` on INTKEY - may not work
- \`IsNot\` - may not work
- \`Length LessThan\` - NOT supported
- Using complex @variables in KEYCHAIN (stick to @data.SOURCE and @data.STATUS)
- Using @parsedVariable in KEYCHAIN (stick to @data.SOURCE)

### Other Common Blocks

#### ConstantString — Set a string variable:
\`\`\`
BLOCK:ConstantString
  value = "my string value"
  => VAR @myVar
ENDBLOCK
\`\`\`

#### RandomInteger — Generate random number:
\`\`\`
BLOCK:RandomInteger
  minimum = 0
  maximum = 100
  => VAR @randomNum
ENDBLOCK
\`\`\`

#### RandomString — Generate random string:
\`\`\`
BLOCK:RandomString
  length = 16
  allowedCharacters = "abcdefghijklmnopqrstuvwxyz0123456789"
  => VAR @randomStr
ENDBLOCK
\`\`\`

#### Substring — Extract part of a string:
\`\`\`
BLOCK:Substring
  input = @data.SOURCE
  index = 0
  length = 100
  => VAR @partial
ENDBLOCK
\`\`\`

#### Replace — Replace text in a string:
\`\`\`
BLOCK:Replace
  input = @myVar
  toReplace = "old"
  replaceWith = "new"
  => VAR @result
ENDBLOCK
\`\`\`

#### URLEncode — URL-encode a string:
\`\`\`
BLOCK:URLEncode
  input = @myVar
  => VAR @encoded
ENDBLOCK
\`\`\`

#### Base64Encode / Base64Decode:
\`\`\`
BLOCK:Base64Encode
  input = @myVar
  => VAR @encoded
ENDBLOCK
\`\`\`

#### Hash — Generate hash:
\`\`\`
BLOCK:Hash
  input = @myVar
  hashType = MD5
  => VAR @hashed
ENDBLOCK
\`\`\`
Hash types: \`MD5\`, \`SHA1\`, \`SHA256\`, \`SHA384\`, \`SHA512\`

#### HMAC — Generate HMAC:
\`\`\`
BLOCK:HMAC
  input = @myVar
  key = "secret"
  hashType = SHA256
  => VAR @hmac
ENDBLOCK
\`\`\`

#### AESEncrypt / AESDecrypt:
\`\`\`
BLOCK:AESEncrypt
  input = @myVar
  key = "0123456789abcdef"
  iv = "abcdef0123456789"
  mode = CBC
  padding = PKCS7
  => VAR @encrypted
ENDBLOCK
\`\`\`

#### Sleep — Pause execution:
\`\`\`
BLOCK:Delay
  milliseconds = 1000
ENDBLOCK
\`\`\`

#### Recaptcha / SolveRecaptchaV2 — Solve captchas:
\`\`\`
BLOCK:SolveRecaptchaV2
  siteKey = "6LcXXXXXXXXX"
  siteUrl = "https://example.com"
  => VAR @captchaResponse
ENDBLOCK
\`\`\`

---

## 5. Statements (Outside Blocks)

### Variable Assignment
\`\`\`
SET VAR @myVar "hello"
SET CAP @captureVar "captured value"
\`\`\`

### Logging
\`\`\`
LOG "This is a log message"
LOG @myVariable
CLOG DarkCyan $"Token: <token>"
\`\`\`

Colors for CLOG: \`Yellow\`, \`Red\`, \`Green\`, \`Blue\`, \`Cyan\`, \`DarkCyan\`, \`Magenta\`, \`White\`

### Proxy Control
\`\`\`
SET USEPROXY TRUE
SET USEPROXY FALSE
SET PROXY "127.0.0.1" 8080 HTTP
SET PROXY "127.0.0.1" 1080 SOCKS5 "username" "password"
\`\`\`

### Flow Control

#### IF / ELSE IF / ELSE / END
\`\`\`
IF STRINGKEY @data.SOURCE Contains "success"
  LOG "Found success!"
ELSE IF INTKEY @data.STATUS GreaterThan 399
  LOG "Error status code"
ELSE
  LOG "Unknown response"
END
\`\`\`

#### WHILE / END
\`\`\`
SET VAR @counter "0"
WHILE INTKEY @counter LessThan 5
  LOG $"Counter: <counter>"
  // increment counter here
END
\`\`\`

#### FOREACH / END
\`\`\`
FOREACH item IN @myList
  LOG @item
END
\`\`\`

#### REPEAT / END
\`\`\`
REPEAT 3
  LOG "This runs 3 times"
END
\`\`\`

#### TRY / CATCH / FINALLY / END
\`\`\`
TRY
  BLOCK:HttpRequest
    url = "https://unstable-api.com"
    method = GET
  ENDBLOCK
CATCH
  LOG "Request failed, continuing..."
FINALLY
  LOG "Cleanup"
END
\`\`\`

#### LOCK / END (thread-safe sections)
\`\`\`
LOCK globals
  // thread-safe code here
END
\`\`\`

### Labels and Jumps
\`\`\`
#MyLabel
LOG "We are at MyLabel"
JUMP #MyLabel
\`\`\`

### Resources (shared data across bots)
\`\`\`
TAKEONE FROM "MyWordlist" => @word
TAKE 5 FROM "MyList" => @items
\`\`\`

### Mark/Unmark Variables as Captures
\`\`\`
MARK @myVar
UNMARK @myVar
\`\`\`

---

## 6. Input Data Variables

When a config processes data from a wordlist, the input is available through:
- \`input.DATA\` — The full data line (e.g., "user@email.com:password123")

For wordlists with the "Credentials" type (which splits on ":"), slices are available:
- \`input.USER\` — First slice (username/email)
- \`input.PASS\` — Second slice (password)

For custom wordlist types with custom slices, the slice names become available as \`input.SLICENAME\`.

---

## 7. Global/Special Variables

- \`data.SOURCE\` — HTTP response body
- \`data.RAWSOURCE\` — HTTP response as raw bytes
- \`data.STATUS\` — HTTP status code (integer)
- \`data.RESPONSECODE\` — HTTP status code (string)
- \`data.HEADERS\` — Response headers (dictionary)
- \`data.COOKIES\` — Response cookies (dictionary)
- \`data.ADDRESS\` — Final URL after redirects
- \`globals\` — Global variables shared across all bots (use in startup script)

---

## 8. Inline C# Code

You can write raw C# code between blocks. The code has access to the \`data\` and \`globals\` objects.

\`\`\`
BLOCK:HttpRequest
  url = "https://example.com/api"
  method = GET
ENDBLOCK

// Inline C# code
string jsonBody = data.SOURCE;
var parsed = Newtonsoft.Json.Linq.JObject.Parse(jsonBody);
string name = parsed["user"]["name"].ToString();
data.MarkForCapture(nameof(name));
\`\`\`

---

## 9. Startup Script

The \`startupLoliCodeScript\` field runs once before the main script. Use it to:
- Initialize shared resources
- Set global variables
- Perform one-time setup (e.g., get an API token shared by all bots)

Example startup script:
\`\`\`
BLOCK:HttpRequest
  url = "https://example.com/api/token"
  method = GET
ENDBLOCK

SET VAR @globals.sharedToken @data.SOURCE
\`\`\`

---

## 10. Complete Config Example

Here's a complete LoliCode script for a credential-checking config:

\`\`\`
// Step 1: Get login page (grab CSRF token)
BLOCK:HttpRequest
  url = "https://example.com/login"
  method = GET
ENDBLOCK

// Step 2: Extract CSRF token
BLOCK:Parse
  input = @data.SOURCE
  cssSelector = "input[name='csrf_token']"
  attributeName = "value"
  mode = CSS
  => VAR @csrfToken
ENDBLOCK

// Step 3: Submit login form
BLOCK:HttpRequest
  url = "https://example.com/api/login"
  method = POST
  customHeaders = {("Content-Type", "application/json"), ("X-CSRF-Token", "<csrfToken>")}
  stringContent = $"{\\"email\\":\\"<input.USER>\\",\\"password\\":\\"<input.PASS>\\"}"
  contentType = "application/json"
ENDBLOCK

// Step 4: Parse response for account info
BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.user.subscription"
  mode = JSON
  => CAP @subscription
ENDBLOCK

BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.user.email"
  mode = JSON
  => CAP @email
ENDBLOCK

// Step 5: Key check for success/fail
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "\\"authenticated\\":true"
    INTKEY @data.STATUS Is 200
  KEYCHAIN FAIL OR
    STRINGKEY @data.SOURCE Contains "invalid"
    STRINGKEY @data.SOURCE Contains "unauthorized"
    INTKEY @data.STATUS Is 401
  KEYCHAIN RETRY OR
    INTKEY @data.STATUS Is 429
    STRINGKEY @data.SOURCE Contains "rate limit"
  KEYCHAIN BAN OR
    INTKEY @data.STATUS Is 403
    STRINGKEY @data.SOURCE Contains "blocked"
ENDBLOCK
\`\`\`

---

## 11. Config Settings (JSON)

When updating a config, the \`settings\` object controls behavior:

\`\`\`json
{
  "allowedWordlistTypes": ["Default", "Credentials"],
  "proxyRules": [],
  "dataRules": [],
  "captureGroups": [],
  "maxEmptyResponses": 5,
  "clearCookies": false,
  "exitOnEnd": false,
  "successNewLine": false,
  "ignoreResponseErrors": false,
  "urlEncodedPostData": false,
  "encodeData": false,
  "forceEncodeData": false
}
\`\`\`

Key settings:
- \`allowedWordlistTypes\` — Which wordlist types this config accepts (e.g., ["Credentials"])
- \`clearCookies\` — Clear cookies between requests within the same bot
- \`maxEmptyResponses\` — Max empty responses before marking as retry
- \`ignoreResponseErrors\` — Don't throw on HTTP errors

---

## 12. Config Metadata (JSON)

\`\`\`json
{
  "name": "My Config",
  "category": "Category Name",
  "author": "Author Name",
  "base64Image": "",
  "creationDate": "2025-01-01T00:00:00Z",
  "lastModified": "2025-01-01T00:00:00Z",
  "plugins": []
}
\`\`\`

---

## 13. Tips for Writing Good Configs

1. **Always include a Keycheck block (BLOCK:Keycheck)** — Without it, all attempts are marked as NONE.
2. **Use CAP for capture variables** — Only CAP variables appear in hit output.
3. **Use descriptive labels** — \`BLOCK:HttpRequest LABEL:Login Request\` makes configs readable.
4. **Handle rate limiting** — Include RETRY keychains for 429 status codes.
5. **Use SAFE mode for fragile blocks** — Prevents the entire bot from crashing on errors.
6. **Parse what you need** — Extract subscription info, email, name, etc. for valuable captures.
7. **Test with ob2_debug_config** — Use the debug tool to test with sample data before running jobs.
8. **Use interpolated strings** — \`$"text <var> more text"\` is the correct syntax for variable interpolation in strings.
9. **Use the correct wordlist type** — "Credentials" splits on ":" giving input.USER and input.PASS.
10. **Check data.STATUS for HTTP codes** — Use INTKEY for numeric comparisons.

## 14. Common Errors and How to Fix Them

### "Invalid key declaration" errors:
- \`NotContains\` → Use \`Contains\` in FAIL keychain instead
- \`NotEqualTo\` → Use \`EqualTo\` in FAIL keychain instead
- \`Length LessThan\` → NOT supported, remove it
- Complex variables in KEYCHAIN → Stick to \`@data.SOURCE\` and \`@data.STATUS\`

### "Could not parse the setting" errors:
- \`attributeToExtract\` → NOT a valid Parse parameter, remove it
- \`mode = LR\` → Must be \`MODE:LR\` (MODE: prefix on its own line)

### "FormatException" with Keycheck:
- Using @parsedVariable → Stick to @data.SOURCE only
- Complex INTKEY comparisons → Simplify to \`INTKEY @data.STATUS Is 429\`

### Parse capturing too much (LR greedy):
- LR finds FIRST \`leftDelim\` and LAST \`rightDelim\` on the ENTIRE page
- Use unique delimiters like \`itemprop="author">\` instead of \`</small>\`
- For HTML, prefer CSS selector which only captures first match

### CSS selector returning empty:
- CSS only works on \`data.SOURCE\` (raw HTML), NOT on parsed variables
- If you need to chain parses, parse directly from data.SOURCE each time
`;

export const LOLICODE_QUICK_REFERENCE = `
# LoliCode Quick Reference

## Block: BLOCK:Name ... ENDBLOCK
## Output: => VAR @name (variable) or => CAP @name (capture)
## Modifiers: LABEL:Name, DISABLED, SAFE

## Setting Values:
- Fixed: "string", 123, true
- Variable: @varName
- Interpolated: $"text <varName> more"

## Common Blocks:
- HttpRequest — HTTP requests (GET/POST/PUT/DELETE)
- Parse — Extract data (LR/CSS/JSON/REGEX/XPATH)
- Keycheck (BLOCK:Keycheck) — Determine SUCCESS/FAIL/RETRY/BAN
- ConstantString, RandomInteger, RandomString
- Hash, HMAC, Base64Encode, Base64Decode, URLEncode
- Replace, Substring

## Auto Variables (after HttpRequest):
- data.SOURCE (response body)
- data.STATUS (status code)
- data.HEADERS, data.COOKIES, data.ADDRESS

## Input Data:
- input.DATA (full line)
- input.USER, input.PASS (Credentials wordlist)

## Statements:
- SET VAR @name "value" / SET CAP @name "value"
- LOG "message" / CLOG Color "message"
- IF/ELSE IF/ELSE/END, WHILE/END, FOREACH/END, REPEAT/END, TRY/CATCH/FINALLY/END
- JUMP #Label, #LabelName

## Keycheck:
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "text"
  KEYCHAIN FAIL OR
    INTKEY @data.STATUS Is 401
ENDBLOCK
`;

export const CONFIG_CREATION_GUIDE = `
# Guide: Creating an OpenBullet 2 Config via the API

## Step 1: Create an empty config
Use \`ob2_create_config\` to create a new empty config. Note the returned config ID.

## Step 2: Write the LoliCode script
Write your LoliCode script following the syntax reference. A typical config follows this flow:
1. Make an HTTP request to the target
2. Parse the response to extract needed data (tokens, CSRF, etc.)
3. Make the login/check request with the extracted data and input credentials
4. Parse the response for capture data (subscription, email, etc.)
5. Add a BLOCK:Keycheck to determine SUCCESS/FAIL/RETRY/BAN

## Step 3: Update the config
Use \`ob2_update_config\` with the full config data including:
- id (from step 1)
- mode: "LoliCode"
- loliCodeScript: your LoliCode script
- metadata: name, author, category
- settings: allowedWordlistTypes, etc.

## Step 4: Test the config
Use \`ob2_debug_config\` with:
- configId: the config ID
- testData: sample data (e.g., "user@example.com:password123")
- wordlistType: "Credentials" (or "Default")

## Step 5: Create a job
Use \`ob2_create_multirun_job\` with:
- configId: the config ID
- bots: number of parallel threads
- dataPool: reference to a wordlist or file
- proxySources: proxy group or file

## Example: Update Config API Call
The configData JSON should look like:
\`\`\`json
{
  "id": "config-uuid-here",
  "mode": "LoliCode",
  "metadata": {
    "name": "My Config",
    "category": "General",
    "author": "Me",
    "base64Image": "",
    "creationDate": "2025-01-01T00:00:00Z",
    "lastModified": "2025-01-01T00:00:00Z",
    "plugins": []
  },
  "settings": {
    "allowedWordlistTypes": ["Credentials"],
    "proxyRules": [],
    "dataRules": [],
    "captureGroups": [],
    "maxEmptyResponses": 5,
    "clearCookies": false,
    "exitOnEnd": false,
    "successNewLine": false,
    "ignoreResponseErrors": false,
    "urlEncodedPostData": false,
    "encodeData": false,
    "forceEncodeData": false,
    "separateCaptchaContent": false,
    "skipDefaultCaptchaSetup": false,
    "usingCustomInputs": false,
    "allowBinaryResponses": false,
    "forceSni": false,
    "decodeGzip": true,
    "decodeImage": false,
    "autoDecode": true,
    "wordlistPurposes": []
  },
  "readme": "Description of this config",
  "loliCodeScript": "BLOCK:HttpRequest\\n  url = \\"https://example.com\\"\\n  method = GET\\nENDBLOCK",
  "startupLoliCodeScript": "",
  "loliScript": "",
  "startupCSharpScript": "",
  "cSharpScript": "",
  "persistent": true
}
\`\`\`
`;
