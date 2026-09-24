module.exports = {
  apps: [{
    name: 'pintarcbt',
    script: './node_modules/next/dist/bin/next',
    args: 'start -H 0.0.0.0 -p 3000',
    cwd: '/home/kami/upin',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      HOST: '0.0.0.0',
      DATABASE_URL: 'file:./dev.db',
      JWT_SECRET: 'pintarcbt-smkba-secret-2026',
      TZ: 'Asia/Jakarta'
    }
  }]
};
