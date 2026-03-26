import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Menu } from './entities/menu.entity';
import { Model } from 'mongoose';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu | undefined> {
    const category = await this.categoryService.findOne(createMenuDto.category);
    if (!category) throw new NotFoundException('Not Found any Category');
    try {
      const createdMenu = new this.menuModel(createMenuDto);
      return (await createdMenu.save()).populate('category', 'name');
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Menu item name already existed');
      }
    }
  }

  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().exec();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuModel.findById(id).exec();
    if (!menu) throw new NotFoundException('Menu not found!');
    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const updatedMenu = await this.menuModel
      .findByIdAndUpdate(id, updateMenuDto, { new: true })
      .exec();
    if (!updatedMenu) throw new NotFoundException('Menu not found!');
    return updatedMenu;
  }

  async remove(id: string): Promise<Menu> {
    const menu = await this.menuModel.findByIdAndDelete(id).exec();
    if (!menu) throw new NotFoundException('Menu not found!');
    return menu;
  }
}
