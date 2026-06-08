$errors = @()
$warnings = @()

# Sitemap check
$sitemap = Join-Path $PWD 'sitemap.xml'
if (Test-Path $sitemap) {
    try {
        [xml]$sx = Get-Content $sitemap -Raw
        $ns = $sx.DocumentElement.NamespaceURI
        if ($ns) {
            $urls = $sx.urlset.url
        } else {
            $urls = $sx.urlset.url
        }
        if (-not $urls) { $warnings += "sitemap.xml: no <url> entries found" }
        foreach ($u in $urls) {
            if (-not $u.loc -or [string]::IsNullOrWhiteSpace($u.loc)) { $errors += "sitemap.xml: a <url> is missing <loc>" }
        }
    } catch {
        $errors += "sitemap.xml: parse error - $_"
    }
} else { $errors += 'sitemap.xml missing' }

# robots check
$robots = Join-Path $PWD 'robots.txt'
if (Test-Path $robots) {
    $rt = Get-Content $robots -Raw
    if ($rt -notmatch '(?i)Sitemap:') { $warnings += 'robots.txt: does not reference a sitemap' }
    if ($rt -notmatch '(?i)User-agent') { $warnings += 'robots.txt: no User-agent rules found' }
} else { $warnings += 'robots.txt missing' }

# HTML checks
Get-ChildItem -Path $PWD -Filter *.html | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    $headMatch = [regex]::Match($content, '(?is)<head.*?>(.*?)</head>')
    if (-not $headMatch.Success) { $warnings += "$(Split-Path $path -Leaf): no <head> found"; return }
    $head = $headMatch.Groups[1].Value
    $headLower = $head.ToLower()

    if ($headLower.IndexOf('name="robots') -lt 0 -and $headLower.IndexOf("name='robots") -lt 0 -and $headLower.IndexOf('name=robots') -lt 0) { $warnings += "$(Split-Path $path -Leaf): meta robots tag missing" }
    if ($headLower.IndexOf('rel="canonical') -lt 0 -and $headLower.IndexOf("rel='canonical") -lt 0 -and $headLower.IndexOf('rel=canonical') -lt 0) { $warnings += "$(Split-Path $path -Leaf): canonical link missing" }
    if ($headLower.IndexOf('og:title') -lt 0) { $warnings += "$(Split-Path $path -Leaf): og:title missing" }
    if ($headLower.IndexOf('og:description') -lt 0) { $warnings += "$(Split-Path $path -Leaf): og:description missing" }

    # JSON-LD extraction: get script blocks and find those with application/ld+json
    $scriptMatches = [regex]::Matches($head, '<script.*?</script>', 'Singleline, IgnoreCase')
    $jsonBlocks = @()
    foreach ($s in $scriptMatches) {
        $val = $s.Value
        if ($val -match 'application/ld\+json') {
            # remove opening <script ...> and closing </script>
            $inner = [regex]::Replace($val, '(?is)^<script[^>]*>', '')
            $inner = [regex]::Replace($inner, '(?is)</script>$', '')
            $jsonBlocks += $inner.Trim()
        }
    }
    if ($jsonBlocks.Count -eq 0) { $warnings += "$(Split-Path $path -Leaf): no JSON-LD Organization block found" }
    else {
        $foundOrg = $false
        foreach ($text in $jsonBlocks) {
            try {
                $obj = ConvertFrom-Json -InputObject $text -ErrorAction Stop
            } catch {
                $j = [regex]::Match($text, '(?s)\{.*\}')
                if ($j.Success) {
                    try { $obj = ConvertFrom-Json -InputObject $j.Value -ErrorAction Stop } catch { $warnings += "$(Split-Path $path -Leaf): JSON-LD parse failed"; continue }
                } else { $warnings += "$(Split-Path $path -Leaf): JSON-LD block found but could not parse as JSON"; continue }
            }
            if ($obj.'@type' -in @('Organization','LocalBusiness')) {
                $foundOrg = $true
                if (-not $obj.name) { $errors += "$(Split-Path $path -Leaf): JSON-LD Organization missing 'name'" }
                if (-not $obj.url) { $errors += "$(Split-Path $path -Leaf): JSON-LD Organization missing 'url'" }
                if (-not $obj.logo) { $warnings += "$(Split-Path $path -Leaf): JSON-LD Organization missing 'logo'" }
                if (-not $obj.contactPoint) { $warnings += "$(Split-Path $path -Leaf): JSON-LD Organization missing 'contactPoint'" } else {
                    $hasContact = $false
                    foreach ($c in $obj.contactPoint) {
                        if ($c.email -or $c.telephone) { $hasContact = $true }
                    }
                    if (-not $hasContact) { $warnings += "$(Split-Path $path -Leaf): contactPoint present but no email/telephone found" }
                }
            }
        }
        if (-not $foundOrg) { $warnings += "$(Split-Path $path -Leaf): JSON-LD found but no Organization/LocalBusiness type detected" }
    }
}

# Output
Write-Host "VALIDATION SUMMARY"
Write-Host "=================="
Write-Host "Checked sitemap.xml: " -NoNewline; Write-Host (Test-Path $sitemap)
Write-Host "Checked robots.txt: " -NoNewline; Write-Host (Test-Path $robots)
$htm = (Get-ChildItem -Path $PWD -Filter *.html).Count
Write-Host "HTML files scanned: $htm"

if ($errors.Count -gt 0) {
    Write-Host "\nERRORS:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" }
} else { Write-Host "\nNo errors found." -ForegroundColor Green }

if ($warnings.Count -gt 0) {
    Write-Host "\nWARNINGS:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host " - $_" }
} else { Write-Host "\nNo warnings found." -ForegroundColor Green }

if ($errors.Count -gt 0) { exit 2 } else { exit 0 }
