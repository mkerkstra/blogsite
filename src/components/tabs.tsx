import {Tabs, TabList, TabPanels, Tab, TabPanel, Table, Text} from '@chakra-ui/react';

export function DataTabs<T extends { label: string, content: string | typeof Table}[]>(
    args: {data: T, tabsProps?: Parameters<typeof Tabs>[0], tabProps?: Parameters<typeof Tab>[0]},
) {
  return (
    <Tabs variant='solid-rounded' orientation='vertical' size='lg' colorScheme='gray' {...args?.tabsProps}>
      <TabList>
        {args.data.map(({label}) => (
          <Tab key={label} {...args?.tabProps}>
            <Text>{label}</Text>
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {args.data.map(({label, content}) => (
          <TabPanel key={label}>
            {content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
