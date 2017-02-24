const { readFile } = require('fs')
const path = require('path')
const { exec } = require('child_process')

const ora = require('ora')
const { prompt } = require('inquirer')

const TYPE_DEPENDENCY = 'dependency'
const TYPE_DEV_DEPENDENCY = 'devDependency'
const CUSTOM_VERSION_CHOICE = 'Input your custom version!'
const NO_UPDATE_CHOICE = 'Don\'t update this dependency'

const fetchPackageList = () => {
  return new Promise((resolve, reject) => {
    readFile(path.resolve(__dirname, './package.json'), (readErr, data) => {
      if (readErr) {
        reject(readErr)
      } else {
        try {
          const { dependencies, devDependencies } = JSON.parse(data)
          resolve({
            dependencies,
            devDependencies
          })
        } catch (parseErr) {
          reject(parseErr)
        }
      }
    })
  })
}

const formatVersionStr = str => {
  return str.match(/\d.*\d/g)[0]
}

const mapDependencieToArray = (dependenciesObj, dependenciesType) =>
  Object.keys(dependenciesObj).map(packageName => ({
    package: packageName,
    type: dependenciesType,
    version: formatVersionStr(dependenciesObj[packageName])
  }))

const fetchInfo = listOfDenpendencyInfo => Promise.all(
  listOfDenpendencyInfo.map(info => new Promise((resolve, reject) => {
    exec(`yarn info ${info.package} dist-tags --json`, (err, stdout) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          package: info.package,
          type: info.type,
          tagsOfVersion: JSON.parse(stdout).data
        })
      }
    })
  }))
)

const getOriginalVersion = (packageName, dependenciesType, originalInfo) => {
  if (dependenciesType === TYPE_DEPENDENCY) {
    return formatVersionStr(originalInfo.dependencies[packageName])
  } else {
    return formatVersionStr(originalInfo.devDependencies[packageName])
  }
}

const getOutdatedPackage = (originalDependenciesInfo, fetchedInfo) => fetchedInfo.filter(
  info => !Object.values(info.tagsOfVersion)
    .includes(getOriginalVersion(info.package, info.type, originalDependenciesInfo))
)

// make 'latest' and 'next' in the top
const sortTags = tagsOfVersion => Object.keys(tagsOfVersion).sort((a, b) => {
  if (a === 'latest') {
    return -1
  } else if (b === 'latest') {
    return 1
  } else if (a === 'next') {
    return -1
  } else if (b === 'next') {
    return 1
  } else {
    return 0
  }
})

const chooseVersion = async (info, originalInfo) => {
  // generate message
  const originalVersion = getOriginalVersion(info.package, info.type, originalInfo)
  let message = 'Package `' + info.package + '` is now at ' +
    originalVersion +
    '\nYou can update to:\n'
  const listOfTags = sortTags(info.tagsOfVersion)
  listOfTags.forEach(tagName => {
    message += '        ' + tagName + '  →  ' + info.tagsOfVersion[tagName] + '\n'
  })

  const { answer } = await prompt({
    type: 'list',
    name: 'answer',
    message,
    choices: [
      ...listOfTags,
      CUSTOM_VERSION_CHOICE,
      NO_UPDATE_CHOICE
    ]
  })

  return answer
}

const getCustomVersion = async () => {
  const { version } = await prompt({
    type: 'input',
    name: 'version',
    message: 'Input your custom version: ',
    validate: version => {
      if (version !== '') {
        return true
      }
      return 'Version can\'t be empty!'
    }
  })
  return version
}

const getUpdateList = async (listOfOutdated, originalInfo) => {
  let result = []
  for (let info of listOfOutdated) {
    const answeredTag = await chooseVersion(info, originalInfo)
    if (answeredTag === CUSTOM_VERSION_CHOICE) {
      const version = await getCustomVersion()
      result.push({
        package: info.package,
        type: info.type,
        version
      })
    } else if (answeredTag !== NO_UPDATE_CHOICE) {
      result.push({
        package: info.package,
        type: info.type,
        version: '^' + info.tagsOfVersion[answeredTag]
      })
    }
  }
  return result
}

const confirmUpdate = async (updateList, originalInfo) => {
  // generate message
  let message = '  ⚠️  Is this all right?\n\n'
  updateList.forEach(updateInfo => {
    const updateVersion = formatVersionStr(updateInfo.version)
    let originalVersion
    if (updateInfo.type === TYPE_DEPENDENCY) {
      originalVersion = formatVersionStr(originalInfo.dependencies[updateInfo.package])
    } else {
      originalVersion = formatVersionStr(originalInfo.devDependencies[updateInfo.package])
    }
    message += `        ${updateInfo.package}:    ${originalVersion}  →  ${updateVersion}\n`
  })

  const { confirm } = await prompt({
    type: 'confirm',
    name: 'confirm',
    message,
    default: false
  })
  return confirm
}

const upgradePackages = async updateList => {
  for (const info of updateList) {
    await new Promise((resolve, reject) => {
      exec(`yarn upgrade ${info.package}@${info.version}`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

const main = async () => {
  const readJsonOra = ora('Reading package.json').start()
  try {
    var originalInfo = await fetchPackageList()
  } catch (e) {
    readJsonOra.fail('Read package.json failed!')
    console.error(e)
    return
  }
  readJsonOra.succeed('Read package.json success!')

  const originalDependenciesInfo = originalInfo.dependencies
  const originalDevDependenciesInfo = originalInfo.devDependencies

  const listOfOriginalInfo = [
    ...mapDependencieToArray(originalDependenciesInfo, TYPE_DEPENDENCY),
    ...mapDependencieToArray(originalDevDependenciesInfo, TYPE_DEV_DEPENDENCY)
  ]

  const fetchInfoOra = ora({
    text: 'fetching version info',
    spinner: 'dots12',
    color: 'cyan'
  }).start()

  try {
    var fetchedInfo = await fetchInfo(listOfOriginalInfo)
  } catch (e) {
    fetchInfoOra.fail('Fetching version info failed!')
    console.error(e)
    return
  }
  fetchInfoOra.succeed('Fetched version info')

  const outdatedPackage = getOutdatedPackage(originalInfo, fetchedInfo)

  const updateList = await getUpdateList(outdatedPackage, originalInfo)

  if (await confirmUpdate(updateList, originalInfo)) {
    const upgradeOra = ora({
      text: 'upgrading packages',
      color: 'magenta'
    }).start()

    try {
      await upgradePackages(updateList)
    } catch (e) {
      upgradeOra.fail('Upgrade packages failed!')
      console.error(e)
      return
    }
    upgradeOra.succeed('Upgraded packages!')
  }
  ora('Done!').succeed()
}

main()
