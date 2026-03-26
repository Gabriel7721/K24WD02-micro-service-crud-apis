import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { UsersModule } from 'src/users/users.module';
import { MenuModule } from 'src/menu/menu.module';
import { Menu, MenuSchema } from 'src/menu/entities/menu.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Menu.name, schema: MenuSchema },
    ]),
    UsersModule,
    MenuModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
