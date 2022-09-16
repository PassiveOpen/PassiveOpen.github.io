import { AfterViewInit, Component } from '@angular/core';
import { Section, SensorType, Tag } from 'src/app/components/enum.data';
import { HouseService } from 'src/app/house/house.service';
import { Sensor } from 'src/app/model/specific/sensor.model';
import { BehaviorSubject } from 'rxjs';
import { Door } from 'src/app/model/specific/door.model';
import { Window, WindowForm } from 'src/app/model/specific/window.model';
import { Cost, CostTable, GroupRow } from 'src/app/house/cost.model';
import { Wall } from 'src/app/model/specific/wall.model';
import { sum } from 'src/app/shared/global-functions';

@Component({
  selector: 'app-page-costs',
  templateUrl: './page-costs.component.html',
  styleUrls: ['./page-costs.component.scss'],
})
export class PageCostsComponent {
  tables = [
    this.getConstruction(),
    this.getOpenings(),
    this.getElectra(),
    this.getFinish(),
    this.getPreps(),
  ];
  hiddenTables = [this.getKitchen(), this.getBathroom()];

  totals = this.getTotals();

  constructor(private houseService: HouseService) {}
  getTable(name) {
    return [...this.tables, ...this.hiddenTables].find((x) => x.name === name);
  }
  getFinish(): CostTable {
    const house = this.houseService.house$.value;
    const { innerLength, outerLength } = this.houseService.getWallLength();
    const { innerArea, outerArea } = this.houseService.getWallArea();
    return {
      name: 'finish',
      alias: 'Finishes',
      // desc: TemplateRef<any>,
      costs: [
        new Cost({
          amount: innerLength,
          name: 'Crown molding',
          price: 3,
          unit: 'm',
        }),
        new Cost({
          amount: innerLength,
          name: 'Baseboard',
          price: 3,
          unit: 'm',
        }),
        this.houseService.getT<Door>(Door, [], (door) => ({
          name: 'Door casing',
          price: 60,
        })),
        this.houseService.getT<Window>(Window, [], (door) => ({
          name: 'Window casing',
          price: 60,
        })),
        new Cost({
          amount: innerLength,
          name: 'Gips boards',
          price: 10,
          unit: 'm2',
        }),
      ],
    };
  }

  getElectra(): CostTable {
    const house = this.houseService.house$.value;
    return {
      name: 'electra',
      alias: 'Electra',
      costs: [
        new Cost({
          amount: this.houseService.getGroups(SensorType.socket).length,
          name: 'Circuit breaker',
          sizeOrVersion: '10A - 240v',
          price: 10,
        }),
        new Cost({
          amount: Math.ceil(
            this.houseService.getGroups(SensorType.socket).length / 4
          ),
          name: 'Group Circuit breaker',
          sizeOrVersion: '240v',
          price: 80,
        }),

        this.houseService.getT<Sensor<any>>(
          Sensor,
          ['sensorType'],
          (x) => ({
            name: 'Power socket',
            sizeOrVersion: `230v`,
            price: 20,
          }),
          (x) => {
            return x.sensorType === SensorType.socket;
          }
        ),
        this.houseService.getT<Sensor<any>>(
          Sensor,
          ['sensorType'],
          (x) => ({
            name: 'Electric wires',
            sizeOrVersion: '2.5mm2 230v',
            price: 2.0,
            unit: 'm',
          }),
          (x) => [SensorType.socket].includes(x.sensorType),
          false
        ),

        this.houseService.getT<Sensor<any>>(
          Sensor,
          [],
          (x) => ({
            name: 'Ethernet cable',
            sizeOrVersion: 'CAT6',
            price: 0.6,
            unit: 'm',
          }),
          (x) => [SensorType.ethernet, SensorType.poe].includes(x.sensorType),
          false
        ),
      ],
    };
  }
  getPreps(): CostTable {
    return {
      name: 'preps',
      alias: 'Preparations',
      costs: [
        new Cost({
          name: 'Ground prep',
          price: 9000,
        }),
        new Cost({
          name: 'Constructions calculations',
          price: 3000,
        }),
        new Cost({
          name: 'PassivHaus Certification',
          price: 3000,
        }),
        new Cost({
          name: 'Utilities connections /fees',
          price: 15000,
        }),
        new Cost({
          name: 'Tool rental',
          price: 3000,
        }),
      ],
    };
  }

  getConstruction(): CostTable {
    const house = this.houseService.house$.value;
    return {
      name: 'construction',
      alias: 'Construction',
      costs: [
        new Cost({
          name: 'foundation',
          price: 9000,
        }),
        new Cost({
          name: 'footer',
          price: 9000,
        }),
        new Cost({
          name: 'Concrete prefab floor',
          price: 32000,
        }),
        new Cost({
          name: 'Studs',
          price: 10000,
        }),
        new Cost({
          name: 'OSB',
          price: 10000,
        }),
      ],
    };
  }
  getBathroom(): CostTable {
    const house = this.houseService.house$.value;
    return {
      name: 'bathroom',
      alias: 'Bathroom',
      costs: [
        new Cost({
          name: 'Complete kitchen',
          price: 9000,
        }),
      ],
    };
  }
  getKitchen(): CostTable {
    const house = this.houseService.house$.value;
    return {
      name: 'kitchen',
      alias: 'Kitchen',
      costs: [
        new Cost({
          name: 'Complete kitchen',
          price: 9000,
        }),
      ],
    };
  }
  getOpenings(): CostTable {
    const house = this.houseService.house$.value;
    return {
      name: 'openings',
      alias: 'Openings',
      costs: [
        this.houseService.getT<Door>(Door, ['outside'], (door) => ({
          name: 'Door',
          sizeOrVersion: `230x${door.width}`,
          price: door.outside ? 600 : 200,
          unit: '#',
          other: `${door.outside ? 'Outer door' : 'Inner door'}`,
        })),

        this.houseService.getT<Window>(
          Window,
          ['width', 'height', 'windowForm'],
          (x) => ({
            name: 'Window',
            sizeOrVersion: `${x.height}x${x.width}`,
            price: x.width * 800,
            other: `${x.windowForm}`,
          }),
          (x) => ![WindowForm.windowWall].includes(x.windowForm)
        ),
        this.houseService.getT<Window>(
          Window,
          ['width', 'height', 'windowForm'],
          (x) => ({
            name: 'Window wall',
            sizeOrVersion: `${x.height}x${x.width}`,
            price: 60000,
            other: `main window wall`,
          }),
          (x) => [WindowForm.windowWall].includes(x.windowForm)
        ),
      ],
    };
  }
  getTotals(): CostTable {
    return {
      name: 'total',
      alias: 'Total',
      costs: [...this.tables, ...this.hiddenTables].flatMap(
        (costTable) =>
          new Cost({
            price: sum(
              costTable.costs
                .filter((x) => x !== undefined)
                .map((y) => y.calcPrice)
            ),
            name: costTable.alias,
          })
      ),
    };
  }
}
