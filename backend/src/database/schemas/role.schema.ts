import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RoleDocument = Role & Document;

export class Permission {
  @ApiProperty()
  @Prop({ required: true })
  id: string;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  description?: string;

  @ApiProperty()
  @Prop({ required: true })
  action: string;

  @ApiProperty()
  @Prop({ required: true })
  resource: string;

  @ApiProperty()
  @Prop({ required: true })
  category: string;
}

@Schema({ 
  timestamps: true, 
  collection: 'roles'
})
export class Role {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  description: string;

  @ApiProperty({ type: [Permission] })
  @Prop({ type: [{ type: Object }], default: [] })
  permissions: Permission[];

  @ApiProperty()
  @Prop({ default: '#1890ff' })
  color: string;

  @ApiProperty()
  @Prop({ default: '🛡️' })
  icon: string;

  @ApiProperty()
  @Prop({ default: false })
  isSystemRole: boolean;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  userCount: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  createdBy?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Virtual field to map _id to id for frontend compatibility
RoleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
RoleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    ret.id = ret._id.toString();
    return ret;
  },
});

// Indexes (name already has unique index from @Prop)
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystemRole: 1 });
RoleSchema.index({ createdAt: -1 });

