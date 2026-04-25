# Supabase 后台快照: 查 profiles / analyses 表最新记录
# 仅用于本地调试,service_role key 从 .env.local 读取

$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: .env.local not found"
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^([A-Z_]+)=(.+)$') { $vars[$Matches[1]] = $Matches[2] }
}

$url = $vars['NEXT_PUBLIC_SUPABASE_URL']
$key = $vars['SUPABASE_SERVICE_ROLE_KEY']

$headers = @{
  'apikey' = $key
  'Authorization' = "Bearer $key"
  'Content-Type' = 'application/json'
  'Prefer' = 'count=exact'
}

Write-Host "========================================"
Write-Host "  Supabase 数据快照 $(Get-Date -Format 'HH:mm:ss')"
Write-Host "========================================"

# profiles
try {
  $profiles = Invoke-RestMethod -Uri "$url/rest/v1/profiles?select=id,email,plan,credits,total_analyses,created_at&order=created_at.desc&limit=5" -Headers $headers -Method Get
  Write-Host ""
  Write-Host "[profiles] 最新 5 条 (共 $($profiles.Count) 条显示):"
  if ($profiles.Count -eq 0) {
    Write-Host "  (空)"
  } else {
    $profiles | ForEach-Object {
      $email = if ($_.email) { $_.email } else { '(no email)' }
      Write-Host ("  {0,-28} plan={1,-4} credits={2,-3} total={3,-3} {4}" -f $email, $_.plan, $_.credits, $_.total_analyses, $_.created_at)
    }
  }
} catch {
  Write-Host "[profiles] FAIL: $($_.Exception.Message)"
}

# analyses
try {
  $analyses = Invoke-RestMethod -Uri "$url/rest/v1/analyses?select=id,user_id,score,model,tokens_used,created_at&order=created_at.desc&limit=5" -Headers $headers -Method Get
  Write-Host ""
  Write-Host "[analyses] 最新 5 条:"
  if ($analyses.Count -eq 0) {
    Write-Host "  (空)"
  } else {
    $analyses | ForEach-Object {
      Write-Host ("  score={0,-3} model={1,-18} tokens={2,-5} {3}" -f $_.score, $_.model, $_.tokens_used, $_.created_at)
    }
  }
} catch {
  Write-Host "[analyses] FAIL: $($_.Exception.Message)"
}

# auth users (通过 admin API)
try {
  $users = Invoke-RestMethod -Uri "$url/auth/v1/admin/users?page=1&per_page=5" -Headers $headers -Method Get
  Write-Host ""
  Write-Host "[auth.users] 最新 5 位 (共 $($users.total) 位注册):"
  $users.users | Select-Object -First 5 | ForEach-Object {
    $conf = if ($_.email_confirmed_at) { 'confirmed' } else { 'pending' }
    Write-Host ("  {0,-28} {1,-10} {2}" -f $_.email, $conf, $_.created_at)
  }
} catch {
  Write-Host "[auth.users] FAIL: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================"
