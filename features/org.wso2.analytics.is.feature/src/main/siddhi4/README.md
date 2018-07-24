Download SP4.2.0 pack.
Start the worker profile using, ./bin/worker.sh from <SP_HOME>
Drop the siddhi files in <SP_HOME>/wso2/worker/deployment/siddhi-files/
To deploy The To deploy the siddhi4 execution files refer link https://docs.wso2.com/display/SP420/Deploying+Streaming+Applications

**For authentication Data Analytics:**
- Download WSO2 stream Processor (This will be referred as <SP_HOME>)
- Open the file "<SP_Home>/conf/worker/deployment.yaml" and add following datasource:
    ```
    - name: IS_DATA_DUMP_DB
    description: The datasource used for dashboard feature
          jndiConfig:
            name: jdbc/IS_DATA_DUMP_DB
            useJndiReference: true
          definition:
            type: RDBMS
            configuration:
              jdbcUrl: 'jdbc:mysql://localhost/IS_DATA_DUMP_DB?useSSL=false'
              username: root
              password: IsAnalytics 
              driverClassName: com.mysql.jdbc.Driver
              maxPoolSize: 50
              idleTimeout: 60000
              validationTimeout: 30000
              isAutoCommit: false
              
- Copy `IS_Analytics_Authentication.siddhi` file to `<SP_HOME>/wso2/worker/deployment/siddhi-files/` directory.

- Copy all the widgets to `<SP_HOME>/wso2/dashboard/deployment/web-ui-apps/portal/extensions/widgets` directory. (Make sure to copy everything under `<Widget Root>/dist/` to the widgets directory.
  
- Now run the worker (`<SP_HOME>/bin/worker.sh` or `<SP_HOME>/bin/worker.bat`) and the dashboard (`<SP_HOME>/bin/dashboard.sh` or `<SP_HOME>/bin/dashboard.bat`)
- Access the dashboard using the given url from the dashboard console.