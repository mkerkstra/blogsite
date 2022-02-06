import {Tabs, TabList, Tab, TabPanels, TabPanel, Table, Tbody, Tr, Td, Text} from '@chakra-ui/react';
import {RequireAtLeastOne} from 'type-fest';

/**
 * @param {args} args - Array of professional experience, broken into company information, role, growth, and accolades.
 * @param {args.company} args.company - includes name, a url to the
 *  about section of the company's website, and a quick overview that'll be rendered in a tooltip.
 * @param {args.role} args.role - this is what my role was at the company,
 *  how long I was there and a short overview of my responsibilities.
 * @param {args.growth} args.growth - a list of what I learned from that project
 * @param {args.accolades} args.accolades - a list of accolades earned while
 * @return {JSX.Element} a section summarizing experience at a company.
 */
export const professionalExperience = (args: {
  company: {
    link?: string;
    size?: string;
  } & RequireAtLeastOne<{
    name?: string;
    quickOverview?: string;
  }>
  role: {
    title: string;
    time: {
      start: `${number}/${number}`;
      /** set to "present" on undefined */
      end?: `${number}/${number}`;
    };
    overview: string;
  }
  projects: {
    title: string;
    overview: string;
    growth: {
      point: string;
      details: string;
    }[];
  }[],
}[]): JSX.Element => {
  return (
    <Tabs
      size='lg'
      isFitted
      defaultIndex={-1}
    >
      <TabList>
        {args.map(({company}) => (
          <Tab key={company?.name ?? company.quickOverview}>{company?.name ?? company.quickOverview}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {args.map(({company, role, projects}, index) => (
          <TabPanel key={index}>
            <Tabs key={index} size='md' defaultIndex={-1}>
              <TabList>
                {Object.keys(args[index]).map((key) => (
                  <Tab key={key}>{key}</Tab>
                ))}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Table>
                    <Tbody>
                      <Tr>
                        <Td><Text>name: </Text></Td>
                        <Td><Text>size: </Text></Td>
                        <Td><Text>overview: </Text></Td>
                      </Tr>
                      <Tr>
                        <Td><Text>{company.name}</Text></Td>
                        <Td><Text>{company.size}</Text></Td>
                        <Td><Text>{company.quickOverview}</Text></Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TabPanel>
                <TabPanel>
                  <Text>{role.title}</Text>
                  <Text>{role.time.start} - {role.time.end || `present`}</Text>
                  <Text>{role.overview}</Text>
                </TabPanel>
                <TabPanel>
                  <Tabs size='md' defaultIndex={-1}>
                    <TabList>
                      {projects.map(({title}) => (
                        <Tab key={title}>{title}</Tab>
                      ))}
                    </TabList>
                    <TabPanels>
                      {projects.map(({title, overview, growth: projectGrowth}) => (
                        <TabPanel key={title}>
                          <Text>{overview}</Text>
                          <Tabs size='sm' defaultIndex={-1}>
                            <TabList>
                              {projectGrowth.map(({point}) => (
                                <Tab key={point}>{point}</Tab>
                              ))}
                            </TabList>
                            <TabPanels>
                              {projectGrowth.map(({point, details}, index) => (
                                <TabPanel key={index}>
                                  <Text>{details}</Text>
                                </TabPanel>
                              ))}
                            </TabPanels>
                          </Tabs>
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </Tabs>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};
