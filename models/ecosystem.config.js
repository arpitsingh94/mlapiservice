module.exports = {
  apps : [{
    name: "modelsAPI",
    script: "./bin/www",
    env: {
      NODE_ENV: "development",
      AWS_REGION: "ap-south-1",
      AWS_DEFAULT_REGION: "ap-south-1"
    },
    env_production: {
      NODE_ENV: "production",
      AWS_REGION: "ap-south-1"
    }
  }]
}