import { PartialType } from '@nestjs/swagger';
import { CreatePincodeDto } from './create-pincode.dto';

export class UpdatePincodeDto extends PartialType(CreatePincodeDto) {}

