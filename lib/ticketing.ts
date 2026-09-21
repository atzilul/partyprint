export const TICKET_STATUSES=['open','in_progress','waiting','done'] as const;
export type TicketStatus=typeof TICKET_STATUSES[number];
export const TICKET_PRIORITIES=['low','normal','high','urgent'] as const;
export type TicketPriority=typeof TICKET_PRIORITIES[number];
export const ticketStatusLabels:Record<TicketStatus,string>={open:'חדש',in_progress:'בטיפול',waiting:'ממתין ללקוח',done:'בוצע'};
export const ticketPriorityLabels:Record<TicketPriority,string>={low:'נמוכה',normal:'רגילה',high:'גבוהה',urgent:'דחוף'};
export type Ticket={id:string;title:string;description:string;status:TicketStatus;priority:TicketPriority;customerName:string;customerEmail:string;orderId:string;assigneeEmail:string;assigneeName:string;createdByEmail:string;createdByName:string;dueAt:string;createdAt:string;updatedAt:string;version:number;lastMessage?:string};
export type TicketMessage={id:string;ticketId:string;authorEmail:string;authorName:string;body:string;createdAt:string};
export type TicketAssignee={email:string;name:string;role:string};
export function ticketStatusLabel(status:string){return ticketStatusLabels[status as TicketStatus]||status}
export function ticketPriorityLabel(priority:string){return ticketPriorityLabels[priority as TicketPriority]||priority}
