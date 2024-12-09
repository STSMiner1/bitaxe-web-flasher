import { DeviceData, GithubRelease, FirmwareData, BoardData } from '../types/firmware';

const deviceOrder = ['Max', 'Ultra', 'Supra', 'Gamma'];

const processReleases = (releases: GithubRelease[]): DeviceData[] => {
  const deviceMap = new Map<string, Map<string, Set<FirmwareData>>>()

  releases.forEach(release => {
    release.assets.forEach(asset => {
      const match = asset.name.match(/esp-miner-factory-(\d+)-v([\d.]+)\.bin/)
      if (match) {
        const [_, boardId, version] = match
        
        let deviceType = 'Unknown'
        if (boardId.startsWith('1')) deviceType = 'Max'
        else if (boardId.startsWith('2')) deviceType = 'Ultra'
        else if (boardId.startsWith('3')) deviceType = 'UltraHex'
        else if (boardId.startsWith('4')) deviceType = 'Supra'
        else if (boardId.startsWith('6')) deviceType = 'Gamma'

        if (!deviceMap.has(deviceType)) {
          deviceMap.set(deviceType, new Map())
        }
        const boardMap = deviceMap.get(deviceType)!
        
        if (!boardMap.has(boardId)) {
          boardMap.set(boardId, new Set())
        }
        
        // Use the direct download URL from the release asset
        boardMap.get(boardId)!.add({
          version,
          path: asset.browser_download_url
        })
      }
    })
  })

  const devicesArray: DeviceData[] = []
  deviceMap.forEach((boardMap, deviceName) => {
    const boards: BoardData[] = []
    boardMap.forEach((firmwareSet, boardId) => {
      const firmwareArray = Array.from(firmwareSet)
        .sort((a, b) => {
          const verA = a.version.split('.').map(Number)
          const verB = b.version.split('.').map(Number)
          for (let i = 0; i < Math.max(verA.length, verB.length); i++) {
            const numA = verA[i] || 0
            const numB = verB[i] || 0
            if (numA !== numB) return numB - numA
          }
          return 0
        })

      boards.push({
        name: boardId,
        supported_firmware: firmwareArray
      })
    })
    
    if (boards.length > 0) {
      devicesArray.push({
        name: deviceName,
        boards: boards.sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })

  return devicesArray.sort((a, b) => {
    const indexA = deviceOrder.indexOf(a.name);
    const indexB = deviceOrder.indexOf(b.name);
    return indexA - indexB;
  });
}

export async function fetchGithubReleases(): Promise<DeviceData[]> {
  const response = await fetch(
    'https://api.github.com/repos/skot/ESP-Miner/releases?per_page=10'
  )

  if (!response.ok) {
    throw new Error('Failed to fetch releases')
  }

  const allReleases: GithubRelease[] = await response.json()
  const releases = allReleases.slice(0, 5)
  return processReleases(releases)
}
