Download SP4.2.0 pack.
Start the worker profile using, ./bin/worker.sh from <SP_HOME>
Drop the siddhi files in <SP_HOME>/wso2/worker/deployment/siddhi-files/
To deploy The To deploy the siddhi4 execution files refer link https://docs.wso2.com/display/SP420/Deploying+Streaming+Applications

**For authentication Data Analytics:**
- Download WSO2 stream Processor (This will be referred as <SP_HOME>)
- Open the file "<SP_Home>/conf/worker/deployment.yaml" and add following datasource:
    ```
    - name: IS_ANALYTICS_DB
      description: The datasource used for dashboard feature
      jndiConfig:
        name: jdbc/IS_ANALYTICS_DB
      definition:
        type: RDBMS
        configuration:
          jdbcUrl: 'jdbc:h2:${sys:carbon.home}/wso2/dashboard/database/IS_ANALYTICS_DB;AUTO_SERVER=TRUE'
          username: wso2carbon
          password: wso2carbon
          driverClassName: org.h2.Driver
          maxPoolSize: 50
          idleTimeout: 60000
          validationTimeout: 30000
          isAutoCommit: false
              
- Copy all the `.siddhi` files to `<SP_HOME>/wso2/worker/deployment/siddhi-files/` directory.

- Setup geo database as described in the following:
    - [Download and configure Geolocation Database](https://docs.wso2.com/display/AM210/Configuring+Geolocation+Based+Statistics).    

- Then add following configuration to the `<SP_Home>/conf/worker/deployment.yaml` file.

    ```
    siddhi:
      extensions:
        -
          extension:
            name: 'findCountryFromIP'
            namespace: 'geo'
            properties:
              geoLocationResolverClass: org.wso2.extension.siddhi.execution.geo.internal.impl.DefaultDBBasedGeoLocationResolver
              isCacheEnabled: true
              cacheSize: 10000
              isPersistInDatabase: true
              datasource: IS_ANALYTICS_DB
        -
          extension:
            name: 'findCityFromIP'
            namespace: 'geo'
            properties:
              geoLocationResolverClass: org.wso2.extension.siddhi.execution.geo.internal.impl.DefaultDBBasedGeoLocationResolver
              isCacheEnabled: true
              cacheSize: 10000
              isPersistInDatabase: true
              datasource: IS_ANALYTICS_DB

- Copy all the widgets to `<SP_HOME>/wso2/dashboard/deployment/web-ui-apps/portal/extensions/widgets` directory. (Make sure to copy everything under `<Widget Root>/dist/` to the widgets directory.
  
- Now run the worker (`<SP_HOME>/bin/worker.sh` or `<SP_HOME>/bin/worker.bat`) and the dashboard (`<SP_HOME>/bin/dashboard.sh` or `<SP_HOME>/bin/dashboard.bat`)
- Access the dashboard using the given url from the dashboard console.
