
                    Write-Host 'Guncelleme baslatiliyor...'
                    Start-Sleep -Seconds 2
                    
                    Write-Host 'NetLiveness API durduruluyor...'
                    # Stop-Process -Name 'NetLiveness.Api' -Force -ErrorAction SilentlyContinue
                    # Gerçek sunucuda burada API durdurulur. Geliştirme ortamında pas geçiyoruz.
                    
                    Start-Sleep -Seconds 3
                    
                    Write-Host 'Dosyalar indiriliyor (https://example.com/api/v1.1.0.zip)...'
                    # Invoke-WebRequest -Uri 'https://example.com/api/v1.1.0.zip' -OutFile 'update.zip'
                    # Expand-Archive -Path 'update.zip' -DestinationPath '.\' -Force
                    
                    Start-Sleep -Seconds 4
                    Write-Host 'Guncelleme islemi tamamlandi, servis baslatiliyor...'
                    # Start-Process 'dotnet' -ArgumentList 'run' -WindowStyle Hidden
                