import { Controller, Get } from "@nestjs/common";

@Controller("api/work")
export class WorkController {
  @Get("list")
  getWorkList() {
    return {
      list: [
        { id: 1, title: "Solidity Dev", status: "Open" },
        { id: 2, title: "Product Manager", status: "Reviewing" },
        { id: 3, title: "Frontend Engineer", status: "Closed" },
      ],
      total: 3,
    };
  }
}
