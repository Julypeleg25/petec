import { getQueryRunner } from "../../config/typeORM";
import { sqlQueries } from "../../config/SqlQueries";
import logger from "../../api/utils/Logger";

class TableService {
  async getTableData(
    rowsPerPage: number,
    pageNumber: number,
    query: string,
    filters: Array<any>,
    orderByList: Array<any>,
    args: Array<any>,
    formatting: {},
    variables: {}
  ) {
    let queryRunner;
    console.log("getTableData: " + query);
    const startTime = new Date();
    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      let queryTemplate = `
          SELECT *
          FROM ({subQuery}) t
          WHERE {filters}
          ORDER BY {orderBy}
          OFFSET {limitStart} ROWS
          FETCH NEXT ({limitEnd} - {limitStart}) ROWS ONLY
        `;

      let listSizeQueryTemplate = `SELECT COUNT(*) FROM ({subQuery}) t WHERE {filters}`;

      // Get subQueryValue
      let subQueryValue: string = (sqlQueries as any)[query];

      // Add variables if they exist
      if (variables) {
        queryTemplate = this.addVariables(variables) + queryTemplate;
        listSizeQueryTemplate =
          this.addVariables(variables) + listSizeQueryTemplate;
      }

      // Prepare the query
      const runQuery = queryTemplate
        .replace("{subQuery}", subQueryValue)
        .replace("{rowsPerPage}", String(rowsPerPage + 1))
        .replace(/\{limitStart\}/g, String(pageNumber))
        .replace("{limitEnd}", String(pageNumber + rowsPerPage))
        .replace("{orderBy}", this.getOrderByString(orderByList))
        .replace("{filters}", this.getFiltersString(filters));

      let dataSize = 0;
      const result = await queryRunner.manager.query(
        listSizeQueryTemplate
          .replace("{subQuery}", subQueryValue)
          .replace("{filters}", this.getFiltersString(filters)),
        args
      );

      if (result) dataSize = result[0].count;

      if (!formatting || Object.keys(formatting).length === 0) {
        const result = await queryRunner.manager.query(runQuery, args);
        if (queryRunner) await queryRunner.release();
        console.log("getTableData duration", new Date().getTime() - startTime.getTime());
        return { size: dataSize, data: result };
      } else {
        const result = await queryRunner.manager.query(runQuery, args);
        const formattedData = result.map((item: any) => {
          Object.entries(formatting).forEach(([key, value]) => {
            switch (value) {
              case "Timestamp":
                item[key] = this.formatTimeStamp(item[key]);
                break;
              case "TimestampWithTime":
                item[key] = this.formatTimeStampWithTime(item[key]);
                break;
              case "Date":
                item[key] = this.formatDate(item[key]);
                break;
            }
          });
          return item;
        });
        if (queryRunner) {
          console.log("queryRunner", queryRunner);
          await queryRunner.release();
        }
        console.log("getTableData duration", new Date().getTime() - startTime.getTime());
        return { size: dataSize, data: formattedData };
      }
    } catch (e: any) {
      if (queryRunner) {
        console.log("queryRunner", queryRunner);
        await queryRunner.release();
      }
      logger.error("Get Table Data Failed: \n" + e.message);
      console.log("getTableData duration", new Date().getTime() - startTime.getTime());
      return { size: 0, data: [], errorMessage: e.message };
    } finally {
      if (queryRunner) {
        console.log("queryRunner", queryRunner);
        console.log("getTableData duration", new Date().getTime() - startTime.getTime());
        await queryRunner.release();
      }
    }
  }

  getFiltersString(filters: Record<string, any> | null): string {
    console.log("getFiltersString: ");
    const startTime = new Date();

    if (!filters || Object.keys(filters).length === 0) return "1 = 1";

    let filtersString = "";

    Object.entries(filters).forEach(([key, value], index) => {
      if (index > 0) filtersString += "AND ";

      if (key === "customFilter") {
        filtersString += value;
        return;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // In case of date search
        filtersString += `${key} BETWEEN '${value} 00:00:00:000' AND '${value} 23:59:59:000' `;
      } else if (value === "TRUE" || value === "FALSE") {
        // In case of boolean search
        filtersString += `${key} = ${value === "TRUE" ? "1" : "0"} `;
      } else {
        // In case of simple search
        filtersString += `${key}::text LIKE '${value.includes("'") ? value.replaceAll("'", "''") : value
          }%' `;
      }
    });

    console.log("filtersString duration", new Date().getTime() - startTime.getTime());
    return filtersString;
  }

  getOrderByString(orderByList: Record<string, any> | null): string {
    if (!orderByList || Object.keys(orderByList).length === 0) return "1";

    let orderByString = "";
    Object.entries(orderByList).forEach(([key, value], index) => {
      if (index === 0) {
        orderByString += `${key} ${value}`;
      } else {
        orderByString += `, ${key} ${value}`;
      }
    });

    return orderByString;
  }

  addVariables(variables: Record<string, any> | null): string {
    if (!variables || Object.keys(variables).length === 0) return "";

    let variablesString = "";
    Object.entries(variables).forEach(([key, value]) => {
      variablesString += `DECLARE @${key} ${value} = ? `;
    });

    return variablesString;
  }

  formatDate(date: any) {
    if (!date) return null;
    const formatter = new Intl.DateTimeFormat("he-IL", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(date));
  }
  formatTimeStampWithTime(timestamp: any) {
    if (!timestamp) return null;
    const formatter = new Intl.DateTimeFormat("he-IL", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return formatter.format(new Date(timestamp));
  }

  formatTimeStamp(timestamp: any) {
    if (!timestamp) return null;
    const formatter = new Intl.DateTimeFormat("he-IL", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(timestamp));
  }
}

export default new TableService();
